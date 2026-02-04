import type { UIMessage, UIMessageChunk } from 'ai';

// Re-export AI SDK types
export type { UIMessage, UIMessageChunk };

export interface ChatState {
  messages: UIMessage[];
  isStreaming: boolean;
  error: Error | null;
}

// Widget-specific types
export interface WidgetTexts {
  // Trigger button
  triggerButtonText?: string;
  triggerButtonAriaLabel?: string;

  // Drawer
  drawerTitle?: string;
  drawerCloseAriaLabel?: string;
  drawerNewSessionAriaLabel?: string;

  // Chat interface
  welcomeMessage?: string;
  exampleQuestionsTitle?: string;
  inputPlaceholder?: string;
  sendButtonAriaLabel?: string;

  // Status messages
  emptyResponseText?: string;
}

export interface WidgetProps {
  // API configuration (required)
  // The complete URL for the SSE stream endpoint, e.g., 'https://example.com/api/stream'
  apiUrl: string;

  // Project identifier (optional)
  // Will be sent in the request body along with messages
  project?: string;

  // UI configuration
  drawerPosition?: 'right' | 'left';
  drawerWidth?: number | string;
  drawerExpandedWidth?: number | string;
  theme?: 'light' | 'dark';

  // Content configuration
  texts?: WidgetTexts;
  exampleQuestions?: string[];

  // Interaction configuration
  hotkey?: string;
  enableHotkey?: boolean;

  // Callbacks
  onOpen?: () => void;
  onClose?: () => void;
  onMessage?: (message: UIMessage) => void;
  onError?: (error: Error) => void;

  // Advanced configuration
  className?: string;
  style?: React.CSSProperties;

  children?: React.ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
  }>
}
