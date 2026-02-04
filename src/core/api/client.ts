import type { SessionResponse } from '../types/index.js';

/**
 * API client for Ask AI widget
 * Supports dynamic API URL configuration and optional project-scoped API
 */
export class APIClient {
  private baseUrl: string;
  private projectId?: string;

  constructor(baseUrl: string, projectId?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.projectId = projectId;
  }

  /**
   * Create a new session
   */
  async createSession(): Promise<SessionResponse> {
    const url = this.projectId
      ? `${this.baseUrl}/api/projects/${this.projectId}/session`
      : `${this.baseUrl}/api/session`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const url = this.projectId
      ? `${this.baseUrl}/api/projects/${this.projectId}/session/${sessionId}`
      : `${this.baseUrl}/api/session/${sessionId}`;

    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }

  /**
   * Ask a question and return the SSE stream response
   */
  async askQuestion(
    sessionId: string,
    question: string,
    signal?: AbortSignal
  ): Promise<Response> {
    const url = this.projectId
      ? `${this.baseUrl}/api/projects/${this.projectId}/ask`
      : `${this.baseUrl}/api/ask`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        question,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to ask question: ${response.statusText}`);
    }

    return response;
  }
}
