export interface ToolCall {
  callID: string;
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

export interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  error: Error | null;
}

export interface SessionResponse {
  sessionId: string;
  expiresIn: number;
}

export interface SSEEvent {
  event: string;
  data: any;
}

export interface SSEConnectedData {
  type: 'connected';
}

export interface SSEAnswerData {
  type: 'answer';
  text: string;
  sessionId: string;
}

export interface SSEDoneData {
  type: 'done';
}

export interface SSEErrorData {
  type: 'error';
  error: string;
}

export interface SSEToolData {
  type: 'tool';
  tool: string;
  callID: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  sessionId: string;
}

export type SSEData = SSEConnectedData | SSEAnswerData | SSEDoneData | SSEErrorData | SSEToolData;

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
  apiUrl: string;

  // Project configuration (optional)
  // If specified, uses project-scoped API endpoints: /api/projects/:projectId/...
  // If not specified, uses global API endpoints: /api/...
  projectId?: string;

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
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;

  // Advanced configuration
  className?: string;
  style?: React.CSSProperties;

  children?: React.ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
  }>
}
