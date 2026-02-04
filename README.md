# Open Ask AI

AI-powered Q&A widget for documentation sites. A customizable button component that opens a drawer-style chat interface, designed to be embedded anywhere in your application.

## Features

- 🎯 **Embeddable Button**: A regular button component that can be placed anywhere in your layout (header, sidebar, footer, etc.)
- 🎨 **Drawer-style UI**: Chat interface appears in a drawer that doesn't block documentation content
- 🌓 **Automatic Dark Mode**: Detects system and site theme automatically
- 🎨 **Customizable Theming**: Override styles via CSS variables
- 🌍 **Multi-language Support**: Customize all UI text through props
- ⌨️ **Keyboard Shortcut**: Optional hotkey support (e.g., Cmd+K)
- ⚡ **Modern Stack**: Built with React 19, TypeScript, and Tailwind CSS

## Installation

```bash
npm install open-ask-ai
```

## Quick Start

```tsx
import { AskAIWidget } from 'open-ask-ai'
import 'open-ask-ai/dist/index.css'

function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation items */}
      </nav>

      {/* Embed the Ask AI button anywhere */}
      <AskAIWidget
        apiUrl="http://localhost:3000"
        exampleQuestions={[
          "How do I get started?",
          "What are the key features?"
        ]}
      />
    </header>
  )
}
```

## Configuration

### Widget Props

```tsx
interface WidgetProps {
  // Required
  apiUrl: string                      // Agent API URL

  // UI Configuration
  drawerPosition?: 'right' | 'left'   // Drawer slide direction (default: 'right')
  drawerWidth?: number | string       // Drawer width (default: 400)

  // Content
  texts?: WidgetTexts                 // All UI text labels (see below)
  exampleQuestions?: string[]         // Questions shown in empty state

  // AI Configuration
  systemPrompt?: string               // Custom system prompt for AI assistant

  // Interaction
  hotkey?: string                     // Keyboard shortcut (e.g., 'cmd+k', 'ctrl+k')
  enableHotkey?: boolean              // Enable/disable hotkey (default: true)

  // Callbacks
  onOpen?: () => void                 // Called when drawer opens
  onClose?: () => void                // Called when drawer closes
  onMessage?: (message: Message) => void
  onError?: (error: Error) => void

  // Styling
  className?: string                  // Additional CSS classes
  style?: React.CSSProperties         // Inline styles (for CSS variables)
}
```

### Customizing Text Labels

All UI text can be customized through the `texts` prop:

```tsx
interface WidgetTexts {
  // Button
  triggerButtonText?: string          // Default: "Ask AI"
  triggerButtonAriaLabel?: string     // Default: "Open AI assistant"

  // Drawer
  drawerTitle?: string                // Default: "Ask AI"
  drawerCloseAriaLabel?: string       // Default: "Close"

  // Chat interface
  welcomeMessage?: string
  exampleQuestionsTitle?: string
  inputPlaceholder?: string
  sendButtonAriaLabel?: string

  // Status messages
  emptyResponseText?: string          // Default: "AI 未能生成回复,请重试"
}
```

### Theming

Override CSS variables to customize the appearance:

```css
.ask-ai {
  --ask-ai-primary: #10b981;
  --ask-ai-primary-hover: #059669;
  --ask-ai-font-family: 'Inter', sans-serif;
  /* Add more custom variables as needed */
}
```

### Multi-language Support

```tsx
<AskAIWidget
  apiUrl="..."
  texts={{
    triggerButtonText: "问 AI",
    drawerTitle: "AI 助手",
    welcomeMessage: "你好！有什么可以帮你的吗？",
    inputPlaceholder: "输入你的问题...",
  }}
/>
```

## Usage Examples

### Embed in Header

```tsx
import { AskAIWidget } from 'open-ask-ai'

function Header() {
  return (
    <header className="flex items-center justify-between">
      <Logo />
      <nav>{/* Navigation items */}</nav>
      <div className="flex items-center gap-2">
        <AskAIWidget apiUrl="http://localhost:3000" />
        <ThemeToggle />
      </div>
    </header>
  )
}
```

### Embed in Sidebar

```tsx
function Sidebar() {
  return (
    <aside>
      <nav>{/* Menu items */}</nav>
      <div className="mt-auto p-4">
        <AskAIWidget
          apiUrl="http://localhost:3000"
          drawerPosition="left"
        />
      </div>
    </aside>
  )
}
```

### With Keyboard Shortcut

```tsx
<AskAIWidget
  apiUrl="http://localhost:3000"
  hotkey="cmd+k"          // Cmd+K on Mac, Ctrl+K on Windows/Linux
  enableHotkey={true}
/>
```

### With Event Callbacks

```tsx
<AskAIWidget
  apiUrl="http://localhost:3000"
  onOpen={() => console.log('AI assistant opened')}
  onClose={() => console.log('AI assistant closed')}
  onMessage={(message) => {
    // Track messages for analytics
    analytics.track('ai_message', { role: message.role })
  }}
  onError={(error) => {
    // Handle errors
    console.error('AI error:', error)
  }}
/>
```

### Custom System Prompt

Customize the AI assistant's behavior with a custom system prompt:

```tsx
<AskAIWidget
  apiUrl="http://localhost:3000"
  systemPrompt="You are a helpful documentation assistant. Answer questions concisely based on the provided documentation. Always respond in the user's language."
/>
```

This allows you to:
- Define the assistant's personality and tone
- Set specific instructions for how to handle questions
- Configure response format preferences
- Specify language preferences

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck
```

## License

MIT
