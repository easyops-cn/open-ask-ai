import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { AskAIWidget } from 'open-ask-ai'
import AskAICss from 'open-ask-ai/styles.css'

const exampleQuestions = [
  'What is Open Ask AI?',
  'How do I integrate Open Ask AI?',
  'Show me an example of using the Open Ask AI',
]

const texts = {
  welcomeMessage: 'Ask me about Open Ask AI!',
}

function initializeAskAI() {
  const navAskAi = document.querySelector('#nav-ask-ai')
  if (!navAskAi) {
    setTimeout(initializeAskAI, 100)
    return
  }
  const style = document.createElement('style')
  style.textContent = AskAICss
  document.head.appendChild(style)
  const root = createRoot(navAskAi)
  root.render(<AskAI />)
}

function AskAI() {
  const [theme, setTheme] = useState(null)

  useEffect(() => {
    const colorModeSwitch = document.querySelector('color-mode-switch')
    if (!colorModeSwitch) {
      setTheme(getPreferColorScheme())
      return
    }

    function handleThemeChange(event) {
      setTheme(event.detail.theme)
    }

    colorModeSwitch.addEventListener('themechange', handleThemeChange)

    // Initialize theme
    const initialTheme = colorModeSwitch.getTheme() || 'light'
    setTheme(initialTheme)

    return () => {
      colorModeSwitch.removeEventListener('themechange', handleThemeChange)
    }
  }, [])

  if (!theme) {
    return null
  }

  return (
    <AskAIWidget
      theme={theme}
      project="open-ask-ai"
      // apiUrl="http://localhost:3000/api/stream"
      apiUrl="https://open-ask-ai.vercel.app/api/stream"
      // apiUrl="https://ask-ai.shenwei.xyz/api/stream"
      texts={texts}
      exampleQuestions={exampleQuestions}
      hotkey="cmd+K"
    />
  )
}

function getPreferColorScheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

initializeAskAI()
