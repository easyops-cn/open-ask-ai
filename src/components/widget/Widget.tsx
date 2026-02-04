import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { APIClient } from '../../core/api/client.js';
import { useChat } from '../../core/hooks/useChat.js';
import type { WidgetProps } from '../../core/types/index.js';
import { Trigger } from './Trigger.js';
import { Drawer } from './Drawer.js';
import styles from './Widget.module.css';

// Lazy load heavy components
const ChatContainer = React.lazy(() => import('../chat/ChatContainer.js').then(m => ({ default: m.ChatContainer })));

export function Widget(props: WidgetProps) {
  const {
    apiUrl,
    projectId,
    drawerPosition = 'right',
    drawerWidth = 600,
    drawerExpandedWidth = 920,
    theme = 'light',
    texts,
    exampleQuestions,
    hotkey,
    enableHotkey = true,
    onOpen,
    onClose,
    onMessage,
    onError,
    className,
    style,
    children,
  } = props;

  const [isOpen, setIsOpen] = React.useState(false);
  const [componentsLoaded, setComponentsLoaded] = React.useState(false);
  const [apiClient] = React.useState(() => new APIClient(apiUrl, projectId));

  // Lift chat state to Widget level to persist across drawer open/close
  const { messages, isStreaming, error, sendMessage, resetChat } = useChat({ apiClient, texts });

  // Input state also needs to persist
  const [input, setInput] = React.useState('');

  // Preload components
  const preloadComponents = React.useCallback(async () => {
    if (componentsLoaded) return;

    try {
      // Trigger lazy loading by importing the modules
      await import('../chat/ChatContainer.js');
      setComponentsLoaded(true);
    } catch (error) {
      console.error('Failed to preload components:', error);
    }
  }, [componentsLoaded]);

  // Handle drawer open
  const handleOpen = React.useCallback(async () => {
    preloadComponents();
    setIsOpen(true);
    onOpen?.();
  }, [preloadComponents, onOpen]);

  // Handle drawer close
  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Handle new session
  const handleNewSession = React.useCallback(async () => {
    setInput('');
    await resetChat();
  }, [resetChat]);

  // Handle keyboard shortcut
  React.useEffect(() => {
    if (!enableHotkey || !hotkey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keys = hotkey.toLowerCase().split('+');
      const ctrl = keys.includes('ctrl') || keys.includes('control');
      const cmd = keys.includes('cmd') || keys.includes('command') || keys.includes('meta');
      const shift = keys.includes('shift');
      const alt = keys.includes('alt');
      const key = keys[keys.length - 1];

      const ctrlPressed = ctrl && (e.ctrlKey || e.metaKey);
      const cmdPressed = cmd && (e.metaKey || e.ctrlKey);
      const shiftPressed = !shift || e.shiftKey;
      const altPressed = !alt || e.altKey;

      if ((ctrlPressed || cmdPressed) && shiftPressed && altPressed && e.key.toLowerCase() === key) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableHotkey, hotkey]);

  return (
    <div className={`ask-ai ${className || ''} ${theme === 'dark' ? 'dark' : ''}`} style={style}>
      {/* Trigger Button - Custom or Default */}
      {children &&  React.isValidElement(children) ? (
        React.cloneElement(children, {
          ...children.props,
          onClick: (e: React.MouseEvent) => {
            // Call existing onClick if present
            const existingOnClick = children.props?.onClick;
            if (existingOnClick) {
              existingOnClick(e);
            }
            // Then call our handleOpen
            handleOpen();
          },
        })
      ) : (
        <Trigger
          onClick={handleOpen}
          text={texts?.triggerButtonText}
          ariaLabel={texts?.triggerButtonAriaLabel}
        />
      )}

      {/* Drawer with Chat */}
      <Drawer
        isOpen={isOpen}
        onClose={handleClose}
        onNewSession={handleNewSession}
        hasMessages={messages.length > 0}
        position={drawerPosition}
        width={drawerWidth}
        expandedWidth={drawerExpandedWidth}
        title={texts?.drawerTitle}
        closeAriaLabel={texts?.drawerCloseAriaLabel}
        newSessionAriaLabel={texts?.drawerNewSessionAriaLabel}
        theme={theme}
      >
        {/* Chat - Lazy loaded with Suspense */}
        {(isOpen || componentsLoaded) && (
          <React.Suspense fallback={
            <Loader2 className={styles.spinning} />
          }>
            <ChatContainer
              texts={texts}
              exampleQuestions={exampleQuestions}
              onMessage={onMessage}
              onError={onError}
              messages={messages}
              isStreaming={isStreaming}
              error={error}
              sendMessage={sendMessage}
              input={input}
              setInput={setInput}
            />
          </React.Suspense>
        )}
      </Drawer>
    </div>
  );
}
