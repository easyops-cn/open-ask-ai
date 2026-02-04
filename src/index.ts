// Main widget component
export { Widget as AskAIWidget } from './components/widget/Widget.js';

// Types
export type {
  Message,
  WidgetProps,
  WidgetTexts,
} from './core/types/index.js';

// API Client (for advanced users)
export { APIClient } from './core/api/client.js';

// Hooks (for custom implementations)
export {
  useChat,
  useSession,
  useSSE,
} from './core/hooks/index.js';

// Import styles
import './styles/variables.css';
import './styles/globals.css';
