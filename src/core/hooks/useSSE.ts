import { useCallback } from 'react';
import type { UIMessage, UIMessageChunk } from '../types/index.js';

interface UseSSEOptions {
  onChunk?: (chunk: UIMessageChunk) => void;
  onError?: (error: Error) => void;
}

interface UseSSEReturn {
  handleUIMessageStream: (response: Response, currentMessage: UIMessage) => Promise<void>;
}

/**
 * Parse SSE chunk format for UIMessageChunk stream
 * Format: "0:{...}\n" where 0 is the chunk type identifier
 */
function parseUIMessageChunk(line: string): UIMessageChunk | null {
  // AI SDK v6 streams chunks in format: "0:{json}\n"
  if (!line.startsWith('0:')) {
    return null;
  }

  try {
    const jsonStr = line.slice(2);
    return JSON.parse(jsonStr) as UIMessageChunk;
  } catch (err) {
    console.error('Failed to parse UIMessageChunk:', line, err);
    return null;
  }
}

export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const { onChunk, onError } = options;

  const handleUIMessageStream = useCallback(
    async (response: Response, _currentMessage: UIMessage) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        onError?.(new Error('No response body'));
        return;
      }

      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');

          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) {
              continue;
            }

            const chunk = parseUIMessageChunk(line);
            if (chunk) {
              onChunk?.(chunk);
            }
          }
        }
      } catch (err) {
        // Don't report AbortError as it's an intentional cancellation
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        const error = err instanceof Error ? err : new Error('SSE stream error');
        onError?.(error);
      } finally {
        reader.releaseLock();
      }
    },
    [onChunk, onError]
  );

  return {
    handleUIMessageStream,
  };
}
