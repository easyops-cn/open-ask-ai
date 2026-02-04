import type { UIMessage } from '../types/index.js';

/**
 * API client for Ask AI widget
 * Supports AI SDK v6 UIMessage format with streaming responses
 */
export class APIClient {
  private apiUrl: string;
  private project?: string;

  constructor(apiUrl: string, project?: string) {
    this.apiUrl = apiUrl;
    this.project = project;
  }

  /**
   * Send messages and get UIMessageStream response
   */
  async sendMessages(
    messages: UIMessage[],
    signal?: AbortSignal
  ): Promise<Response> {
    const body: { messages: UIMessage[]; project?: string } = {
      messages,
    };

    if (this.project) {
      body.project = this.project;
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to send messages: ${response.statusText}`);
    }

    return response;
  }
}
