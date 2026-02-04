import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button.js';
import styles from './Trigger.module.css';

interface TriggerProps {
  onClick: () => void;
  text?: string;
  ariaLabel?: string;
  className?: string;
  isLoading?: boolean;
}

export function Trigger({
  onClick,
  text = 'Ask AI',
  ariaLabel = 'Open AI assistant',
  className,
  isLoading = false,
}: TriggerProps) {
  const classNames = [styles.trigger, className].filter(Boolean).join(' ');

  return (
    <Button
      onClick={onClick}
      variant="outline"
      aria-label={ariaLabel}
      className={classNames}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className={`${styles.icon} ${styles.spinning}`} />
      ) : (
        <Sparkles className={styles.icon} />
      )}
      {text && <span>{text}</span>}
    </Button>
  );
}
