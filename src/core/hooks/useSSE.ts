import { useCallback } from 'react';
import type { SSEData } from '../types/index.js';

interface UseSSEOptions {
  onConnected?: () => void;
  onMessage?: (data: SSEData) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

interface UseSSEReturn {
  handleSSEStream: (response: Response) => Promise<void>;
}

/**
 * Parse SSE chunk format: "event: type\ndata: json\n\n"
 */
function parseSSEChunk(chunk: string): Array<{ event: string; data: any }> {
  const events: Array<{ event: string; data: any }> = [];
  const lines = chunk.split('\n');
  let currentEvent = '';
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6).trim();
    } else if (line === '') {
      // Empty line marks end of event
      if (currentEvent && currentData) {
        try {
          const parsedData = JSON.parse(currentData);
          events.push({
            event: currentEvent,
            data: parsedData,
          });
        } catch (err) {
          console.error('Failed to parse SSE data:', currentData, err);
        }
        currentEvent = '';
        currentData = '';
      }
    }
  }

  return events;
}

export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const { onConnected, onMessage, onDone, onError } = options;

  const handleSSEStream = useCallback(
    async (response: Response) => {
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

          // Process complete events
          const events = parseSSEChunk(buffer);

          for (const { event, data } of events) {
            if (event === 'connected') {
              onConnected?.();
              onMessage?.(data);
            } else if (event === 'answer' || event === 'tool') {
              onMessage?.(data);
            } else if (event === 'done') {
              onDone?.();
              onMessage?.(data);
            } else if (event === 'error') {
              onError?.(new Error(data.error || 'Unknown error'));
              onMessage?.(data);
            }
          }

          // Clear processed events from buffer (keep incomplete data)
          const lastEventEnd = buffer.lastIndexOf('\n\n');
          if (lastEventEnd !== -1) {
            buffer = buffer.slice(lastEventEnd + 2);
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
    [onConnected, onMessage, onDone, onError]
  );

  return {
    handleSSEStream,
  };
}
