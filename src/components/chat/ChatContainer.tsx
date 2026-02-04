import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { common } from 'lowlight';
import type { WidgetTexts, Message } from '../../core/types/index.js';
import styles from './ChatContainer.module.css';
import { ArrowUp, Copy, Check } from 'lucide-react';

interface ChatContainerProps {
  texts?: WidgetTexts;
  exampleQuestions?: string[];
  onMessage?: (message: any) => void;
  onError?: (error: Error) => void;
  // Lifted state from parent
  messages: Message[];
  isStreaming: boolean;
  error: Error | null;
  sendMessage: (text: string) => Promise<void>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
}

export function ChatContainer({
  texts,
  exampleQuestions,
  onMessage,
  onError,
  messages,
  isStreaming,
  error,
  sendMessage,
  input,
  setInput,
}: ChatContainerProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesAreaRef = React.useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = React.useRef(true); // Track if auto-scroll is enabled

  // Check if user is at the bottom of the messages area
  const isAtBottom = React.useCallback(() => {
    const messagesArea = messagesAreaRef.current;
    if (!messagesArea) return true;

    const threshold = 50; // pixels from bottom to consider "at bottom"
    const scrollBottom = messagesArea.scrollHeight - messagesArea.scrollTop - messagesArea.clientHeight;
    return scrollBottom < threshold;
  }, []);

  // Scroll to bottom of messages area
  const scrollToBottom = React.useCallback(() => {
    const messagesArea = messagesAreaRef.current;
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }, []);

  // Handle user scroll events
  const handleScroll = React.useCallback(() => {
    const atBottom = isAtBottom();
    shouldAutoScrollRef.current = atBottom;
  }, [isAtBottom]);

  // Auto-scroll when messages change (if enabled)
  React.useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  // Call onError callback when error occurs
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Call onMessage callback when new message arrives
  React.useEffect(() => {
    if (messages.length > 0 && onMessage) {
      onMessage(messages[messages.length - 1]);
    }
  }, [messages, onMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputValue = input.trim();
    if (!inputValue || isStreaming) return;

    // Enable auto-scroll for new user message
    shouldAutoScrollRef.current = true;

    setInput('');
    await sendMessage(inputValue);
    // Reset textarea height after submission
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        handleSubmit(e as any);
      }
    }
    // Allow Shift+Enter for new line (default textarea behavior)
  };

  const handleExampleClick = async (question: string) => {
    if (isStreaming) return;
    // Enable auto-scroll for new user message
    shouldAutoScrollRef.current = true;
    await sendMessage(question);
  };

  const inputPlaceholder = texts?.inputPlaceholder || 'Ask a question...';
  const welcomeMessage = texts?.welcomeMessage || 'Hi! How can I help you today?';
  const exampleQuestionsTitle = texts?.exampleQuestionsTitle || 'Example questions:';

  // Custom code block component with copy button
  const CodeBlock = ({ children, className, ...props }: any) => {
    const [copied, setCopied] = React.useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const isCodeBlock = match;

    const handleCopy = async () => {
      // Recursively extract text content from React elements
      const getTextContent = (node: any): string => {
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(getTextContent).join('');
        if (node?.props?.children) return getTextContent(node.props.children);
        return '';
      };

      const code = getTextContent(children).replace(/\n$/, '');
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    if (isCodeBlock) {
      return (
        <div className={styles.codeBlockWrapper}>
          <button
            onClick={handleCopy}
            className={styles.copyButton}
            aria-label="Copy code"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <code className={className} {...props}>
            {children}
          </code>
        </div>
      );
    }

    return <code className={className} {...props}>{children}</code>;
  };

  // Helper function to format tool name
  const getToolDisplayName = (toolName: string) => {
    if (toolName.toLowerCase() === 'read') {
      return 'Reading docs';
    }
    if (toolName.toLowerCase() === 'task') {
      return 'Exploring docs';
    }
    return 'Searching docs';
  };

  return (
    <div className={styles.container}>
      {/* Messages Area */}
      <div
        ref={messagesAreaRef}
        onScroll={handleScroll}
        className={styles.messagesArea}
      >
        {messages.length === 0 ? (
          // Welcome Screen
          <div className={styles.welcomeScreen}>
            <p className={styles.welcomeMessage}>
              {welcomeMessage}
            </p>

            {exampleQuestions && exampleQuestions.length > 0 && (
              <div className={styles.exampleQuestionsContainer}>
                <p className={styles.exampleQuestionsTitle}>
                  {exampleQuestionsTitle}
                </p>
                {exampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(question)}
                    className={styles.exampleButton}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Messages
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageWrapper} ${styles[message.role]}`}
              >
                <div className={`${styles.message} ${styles[message.role]}`}>
                  {message.role === 'assistant' ? (
                    <div className={styles.markdown}>
                      {/* Display tool calls if present */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className={styles.toolCallsContainer}>
                          {message.toolCalls.map((toolCall) => (
                            <span
                              key={toolCall.callID}
                              className={`${styles.toolCall} ${styles[`tool-${toolCall.status}`]}`}
                            >
                              {getToolDisplayName(toolCall.tool)}
                              {(toolCall.status === 'completed' || toolCall.status === 'error') ? '' : '...'}
                            </span>
                          ))}
                        </div>
                      )}
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[[rehypeHighlight, {
                          languages: common,
                          prefix: 'hljs-'
                        }]]}
                        components={{
                          code: CodeBlock
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      {message.isStreaming && (
                        <span className={styles.cursor} />
                      )}
                    </div>
                  ) : (
                    <div className={styles.messageText}>
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {error && (
          <div className={styles.error}>
            {error.message}
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            className={styles.input}
            rows={1}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={styles.submitButton}
          >
            <ArrowUp />
          </button>
        </div>
      </form>
    </div>
  );
}
