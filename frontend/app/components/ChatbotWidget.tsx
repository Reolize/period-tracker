"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles } from "lucide-react"
import { apiFetch } from "@/lib/api"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatbotWidgetProps {
  onMessageSend?: (message: string) => void
}

export default function ChatbotWidget({ onMessageSend }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your cycle health assistant. 💗 I can answer questions about your cycle, symptoms, or general wellness. How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // Call the optional onMessageSend callback with the user's message
    onMessageSend?.(userMessage.content)

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await apiFetch("/chat/", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: conversationHistory
        })
      })

      const aiMessage: ChatMessage = {
        role: "assistant",
        content: response.response || "I'm here to help! Could you tell me more?",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment! 🌸",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-[#ff7eb6] to-[#ff6b9d]
          shadow-lg shadow-[#ff7eb6]/30
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-xl
          hover:shadow-[#ff7eb6]/40
          active:scale-95
          ${isOpen ? "opacity-0 pointer-events-none scale-0" : "opacity-100"}
        `}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </button>

      {/* Chat Window */}
      <div
        className={`
          fixed bottom-6 right-6 z-50
          w-[380px] max-w-[calc(100vw-48px)]
          bg-white rounded-3xl
          shadow-2xl shadow-black/20
          border border-[#f0e8ee]
          overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ff7eb6] to-[#ff6b9d] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Cycle Assistant</h3>
                <p className="text-xs text-white/80">Here to help 💗</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-[380px] overflow-y-auto bg-[#faf6f8] p-4 space-y-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`
                flex flex-col
                ${message.role === "user" ? "items-end" : "items-start"}
              `}
            >
              <div
                className={`
                  max-w-[85%] px-4 py-3 rounded-2xl
                  ${message.role === "user"
                    ? "bg-gradient-to-br from-[#ff7eb6] to-[#ff6b9d] text-white rounded-br-md"
                    : "bg-white text-[#3f2b4d] rounded-bl-md shadow-sm border border-[#f0e8ee]"
                  }
                `}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
              <span className="text-[10px] text-[#7d6b86] mt-1 px-1">
                {formatTime(message.timestamp)}
              </span>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-[#f0e8ee]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#ff7eb6] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#ff7eb6] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#ff7eb6] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-[#7d6b86]">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white px-4 py-3 border-t border-[#f0e8ee]">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your cycle, symptoms..."
              className="
                flex-1 px-4 py-2.5
                bg-[#faf6f8] rounded-full
                text-sm text-[#3f2b4d]
                placeholder:text-[#7d6b86]/60
                border border-transparent
                focus:border-[#ff7eb6]/30 focus:bg-white
                focus:outline-none
                transition-all
              "
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`
                px-4 h-10 rounded-full
                flex items-center justify-center
                text-sm font-semibold
                transition-all
                ${inputMessage.trim() && !isLoading
                  ? "bg-gradient-to-br from-[#ff7eb6] to-[#ff6b9d] text-white hover:scale-105 shadow-md"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }
              `}
              aria-label="Send message"
            >
              Next
            </button>
          </div>
          <p className="text-[10px] text-[#7d6b86]/70 text-center mt-2">
            AI assistant • Not a substitute for medical advice
          </p>
        </div>
      </div>
    </>
  )
}
