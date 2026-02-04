import { useState, useCallback, useRef } from 'react';
import { useSSE } from './useSSE.js';
import type { UIMessage, UIMessageChunk, WidgetTexts } from '../types/index.js';
import type { APIClient } from '../api/client.js';

interface UseChatOptions {
  apiClient: APIClient;
  texts?: WidgetTexts;
}

interface UseChatReturn {
  messages: UIMessage[];
  isStreaming: boolean;
  error: Error | null;
  sendMessage: (text: string) => Promise<void>;
  resetChat: () => void;
}

let idCounter = 0;

function getMessageId() {
  idCounter += 1;
  return `msg-${idCounter}`;
}

/**
 * Apply a UIMessageChunk to update the current assistant message
 */
function applyChunkToMessage(message: UIMessage, chunk: UIMessageChunk): UIMessage {
  const parts = [...message.parts];

  switch (chunk.type) {
    case 'text-start': {
      // Start a new text part
      parts.push({
        type: 'text',
        text: '',
        state: 'streaming',
      });
      break;
    }

    case 'text-delta': {
      // Find the last text part and append delta
      const lastTextIndex = parts.findLastIndex((p: any) => p.type === 'text');
      if (lastTextIndex >= 0) {
        const textPart = parts[lastTextIndex];
        if (textPart.type === 'text') {
          parts[lastTextIndex] = {
            ...textPart,
            text: textPart.text + chunk.delta,
          };
        }
      }
      break;
    }

    case 'text-end': {
      // Mark the last text part as done
      const lastTextIndex = parts.findLastIndex((p: any) => p.type === 'text');
      if (lastTextIndex >= 0) {
        const textPart = parts[lastTextIndex];
        if (textPart.type === 'text') {
          parts[lastTextIndex] = {
            ...textPart,
            state: 'done',
          };
        }
      }
      break;
    }

    case 'reasoning-start': {
      // Start a new reasoning part
      parts.push({
        type: 'reasoning',
        text: '',
        state: 'streaming',
      });
      break;
    }

    case 'reasoning-delta': {
      // Find the last reasoning part and append delta
      const lastReasoningIndex = parts.findLastIndex((p: any) => p.type === 'reasoning');
      if (lastReasoningIndex >= 0) {
        const reasoningPart = parts[lastReasoningIndex];
        if (reasoningPart.type === 'reasoning') {
          parts[lastReasoningIndex] = {
            ...reasoningPart,
            text: reasoningPart.text + chunk.delta,
          };
        }
      }
      break;
    }

    case 'reasoning-end': {
      // Mark the last reasoning part as done
      const lastReasoningIndex = parts.findLastIndex((p: any) => p.type === 'reasoning');
      if (lastReasoningIndex >= 0) {
        const reasoningPart = parts[lastReasoningIndex];
        if (reasoningPart.type === 'reasoning') {
          parts[lastReasoningIndex] = {
            ...reasoningPart,
            state: 'done',
          };
        }
      }
      break;
    }

    case 'tool-input-start': {
      // Start a new dynamic tool call
      parts.push({
        type: 'dynamic-tool',
        toolCallId: chunk.toolCallId,
        toolName: chunk.toolName,
        input: undefined,
        state: 'input-streaming',
      } as any);
      break;
    }

    case 'tool-input-available': {
      // Update tool call with input
      const toolIndex = parts.findIndex(
        (p: any) => p.type === 'dynamic-tool' && p.toolCallId === chunk.toolCallId
      );
      if (toolIndex >= 0) {
        const toolPart = parts[toolIndex] as any;
        parts[toolIndex] = {
          ...toolPart,
          input: chunk.input,
          state: 'input-available',
        };
      }
      break;
    }

    case 'tool-output-available': {
      // Update tool call with output
      const toolIndex = parts.findIndex(
        (p: any) => p.type === 'dynamic-tool' && p.toolCallId === chunk.toolCallId
      );
      if (toolIndex >= 0) {
        const toolPart = parts[toolIndex] as any;
        parts[toolIndex] = {
          ...toolPart,
          output: chunk.output,
          state: 'output-available',
        };
      }
      break;
    }

    case 'tool-output-error': {
      // Update tool call with error
      const toolIndex = parts.findIndex(
        (p: any) => p.type === 'dynamic-tool' && p.toolCallId === chunk.toolCallId
      );
      if (toolIndex >= 0) {
        const toolPart = parts[toolIndex] as any;
        parts[toolIndex] = {
          ...toolPart,
          errorText: chunk.errorText,
          state: 'error',
        };
      }
      break;
    }

    case 'error': {
      // Handle error chunk - could add error state to message
      console.error('Stream error:', chunk.errorText);
      break;
    }

    // Add other chunk types as needed
    default:
      // Ignore unknown chunk types
      break;
  }

  return {
    ...message,
    parts,
  };
}

export function useChat({ apiClient }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { handleUIMessageStream } = useSSE({
    onChunk: (chunk) => {
      if (chunk.type === 'error') {
        setError(new Error(chunk.errorText));
        setIsStreaming(false);
        return;
      }

      // Update the last assistant message with the chunk
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          const updatedMessage = applyChunkToMessage(lastMessage, chunk);
          return [...prev.slice(0, -1), updatedMessage];
        }
        return prev;
      });
    },
    onError: (err) => {
      setError(err);
      setIsStreaming(false);
      // Remove the failed assistant message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.parts.length === 0) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    },
  });

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        return;
      }

      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setError(null);
      setIsStreaming(true);

      // Add user message immediately (optimistic UI)
      const userMessage: UIMessage = {
        id: getMessageId(),
        role: 'user',
        parts: [
          {
            type: 'text',
            text,
          },
        ],
      };

      // Add placeholder for assistant response
      const assistantMessage: UIMessage = {
        id: getMessageId(),
        role: 'assistant',
        parts: [],
      };

      const newMessages = [...messages, userMessage];
      setMessages([...newMessages, assistantMessage]);

      try {
        const response = await apiClient.sendMessages(
          newMessages,
          abortController.signal
        );
        await handleUIMessageStream(response, assistantMessage);
        setIsStreaming(false);
      } catch (err) {
        // Don't treat aborted requests as errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const error = err instanceof Error ? err : new Error('Failed to send message');
        setError(error);
        setIsStreaming(false);

        // Remove the failed messages
        setMessages((prev) => prev.slice(0, -2));
      } finally {
        // Clear the abort controller reference if this was the current one
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [messages, apiClient, handleUIMessageStream]
  );

  const resetChat = useCallback(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    resetChat,
  };
}
