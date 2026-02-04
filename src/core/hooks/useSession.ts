import { useState, useEffect, useCallback } from 'react';
import type { APIClient } from '../api/client.js';

interface UseSessionOptions {
  apiClient: APIClient;
}

interface UseSessionReturn {
  sessionId: string | null;
  isCreating: boolean;
  error: Error | null;
  initializeSession: () => Promise<string>;
  clearSession: () => Promise<void>;
}

export function useSession({ apiClient }: UseSessionOptions): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initializeSession = useCallback(async () => {
    setIsCreating(true);
    setError(null);

    try {
      const { sessionId: newSessionId } = await apiClient.createSession();
      setSessionId(newSessionId);
      return newSessionId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create session');
      setError(error);
      console.error('Failed to create session:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [apiClient]);

  const clearSession = useCallback(async () => {
    setSessionId(null);
    setIsCreating(false);
    setError(null);
  }, [sessionId, apiClient, initializeSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        apiClient.deleteSession(sessionId).catch((err) => {
          console.error('Failed to cleanup session on unmount:', err);
        });
      }
    };
  }, [sessionId, apiClient]);

  return {
    sessionId,
    isCreating,
    error,
    initializeSession,
    clearSession,
  };
}
