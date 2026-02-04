import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Sparkles, X, EraserIcon, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/Button.js';
import styles from './Drawer.module.css';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSession?: () => void;
  hasMessages?: boolean;
  position?: 'right' | 'left';
  width?: number | string;
  expandedWidth?: number | string;
  title?: string;
  closeAriaLabel?: string;
  newSessionAriaLabel?: string;
  children?: React.ReactNode;
  theme?: 'light' | 'dark';
}

export function Drawer({
  isOpen,
  onClose,
  onNewSession,
  hasMessages,
  position = 'right',
  width = 600,
  expandedWidth = 920,
  title = 'Ask AI',
  closeAriaLabel = 'Close',
  newSessionAriaLabel = 'New session',
  children,
  theme = 'light',
}: DrawerProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const maxWidth = isExpanded ? expandedWidth : width;

  const contentClasses = [
    styles.content,
    styles[`position-${position}`],
  ].join(' ');

  // Create a portal container that inherits theme from the nearest .ask-ai ancestor
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;

    // Create a portal container with ask-ai class
    const container = document.createElement('div');
    container.className = `ask-ai${theme === 'dark' ? ' dark' : ''}`;
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      document.body.removeChild(container);
    };
  }, [theme]);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal container={portalContainer}>
        {/* Overlay */}
        <DialogPrimitive.Overlay className={styles.overlay} />

        {/* Drawer Content */}
        <DialogPrimitive.Content
          className={contentClasses}
          style={{ maxWidth }}
        >
          {/* Header */}
          <div className={styles.header}>
            <DialogPrimitive.Title className={styles.title}>
              <Sparkles className={styles.icon} />
              {title}
            </DialogPrimitive.Title>
            <div className={styles.headerActions}>
              {onNewSession && hasMessages && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={newSessionAriaLabel}
                  className={styles.newSessionButton}
                  onClick={onNewSession}
                >
                  <EraserIcon className={styles.newSessionIcon} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={isExpanded ? 'Shrink' : 'Expand'}
                className={styles.expandButton}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className={styles.expandIcon} />
                ) : (
                  <Maximize2 className={styles.expandIcon} />
                )}
              </Button>
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={closeAriaLabel}
                  className={styles.closeButton}
                >
                  <X className={styles.closeIcon} />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Content */}
          <div className={styles.body}>
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
