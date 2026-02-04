import { useState, useCallback, useRef } from 'react';
import { useSession } from './useSession.js';
import { useSSE } from './useSSE.js';
import type { Message, WidgetTexts } from '../types/index.js';
import type { APIClient } from '../api/client.js';

interface UseChatOptions {
  apiClient: APIClient;
  texts?: WidgetTexts;
}

interface UseChatReturn {
  messages: Message[];
  isStreaming: boolean;
  error: Error | null;
  sessionError: Error | null;
  isCreatingSession: boolean;
  sendMessage: (text: string) => Promise<void>;
  resetChat: () => Promise<void>;
}

let idCounter = 0;

function getMessageId() {
  idCounter += 1;
  return `msg-${idCounter}`;  
}

export function useChat({ apiClient, texts }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { sessionId, isCreating: isCreatingSession, error: sessionError, initializeSession, clearSession } = useSession({ apiClient });

  const { handleSSEStream } = useSSE({
    onConnected: () => {
      console.log('SSE connected');
    },
    onMessage: (data) => {
      if (data.type === 'answer' && data.text) {
        // Accumulate the answer text
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            // Update the last assistant message
            return prev.slice(0, -1).concat({
              ...lastMessage,
              content: lastMessage.content + data.text,
            });
          }
          return prev;
        });
      } else if (data.type === 'tool') {
        // Handle tool updates
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            // Get existing tool calls or create new array
            const existingToolCalls = lastMessage.toolCalls || [];

            // Find the tool call with this callID
            const toolIndex = existingToolCalls.findIndex(tc => tc.callID === data.callID);

            let updatedToolCalls;
            if (toolIndex >= 0) {
              // Update existing tool call
              updatedToolCalls = [...existingToolCalls];
              updatedToolCalls[toolIndex] = {
                callID: data.callID,
                tool: data.tool,
                status: data.status,
              };
            } else {
              // Add new tool call
              updatedToolCalls = [...existingToolCalls, {
                callID: data.callID,
                tool: data.tool,
                status: data.status,
              }];
            }

            return prev.slice(0, -1).concat({
              ...lastMessage,
              toolCalls: updatedToolCalls,
            });
          }
          return prev;
        });
      }
    },
    onDone: () => {
      // Mark streaming complete
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          // If AI didn't send any content, show a fallback message
          const emptyResponseText = texts?.emptyResponseText || 'Something went wrong. Please try again later.';
          const content = lastMessage.content.trim() || emptyResponseText;
          return prev.slice(0, -1).concat({
            ...lastMessage,
            content,
            isStreaming: false,
          });
        }
        return prev;
      });
      setIsStreaming(false);
    },
    onError: (err) => {
      setError(err);
      setIsStreaming(false);
      // Remove the failed assistant message
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
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
      const userMessage: Message = {
        id: getMessageId(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add placeholder for assistant response
      const assistantMessage: Message = {
        id: getMessageId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Create session if it doesn't exist yet
      let currentSessionId = sessionId;
      if (!currentSessionId && !isCreatingSession) {
        try {
          currentSessionId = await initializeSession();
        } catch (err) {
          setError(new Error('Failed to create session'));
          setIsStreaming(false);
          return;
        }
      }

      // Wait for session to be created if it's currently being created
      if (isCreatingSession) {
        setError(new Error('Session is being created, please try again'));
        return;
      }

      if (!currentSessionId) {
        setError(new Error('No active session'));
        return;
      }

      try {
        const response = await apiClient.askQuestion(
          currentSessionId,
          text,
          abortController.signal
        );
        await handleSSEStream(response);
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
    [sessionId, isCreatingSession, initializeSession, apiClient, handleSSEStream]
  );

  const resetChat = useCallback(async () => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setMessages([]);
    setError(null);
    setIsStreaming(false);
    await clearSession();
  }, [clearSession]);

  return {
    messages,
    isStreaming,
    error,
    sessionError,
    isCreatingSession,
    sendMessage,
    resetChat,
  };
}
