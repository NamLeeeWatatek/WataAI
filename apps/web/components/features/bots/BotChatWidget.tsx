'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { MessageRole } from '@/lib/types/conversations'

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}

interface BotChatWidgetProps {
  botId: string
  functionId: string
  className?: string
  placeholder?: string
}

export function BotChatWidget({
  botId,
  functionId,
  className,
  placeholder = 'Nhập tin nhắn...',
}: BotChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: MessageRole.USER,
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const botMessage: Message = {
        id: `msg-${Date.now()}-bot`,
        role: MessageRole.ASSISTANT,
        content: 'This feature needs to be updated to use the new API',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch {

      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: MessageRole.ASSISTANT,
        content: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className={cn('flex flex-col h-[600px] border rounded-lg bg-background', className)}>
      { }
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="size-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">AI Assistant</h3>
          <p className="text-xs text-muted-foreground">Luôn sẵn sàng hỗ trợ bạn</p>
        </div>
      </div>

      { }
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="size-12 mx-auto mb-2 opacity-50" />
              <p>Xin chào! Tôi có thể giúp gì cho bạn?</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === MessageRole.USER ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === MessageRole.ASSISTANT && (
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="size-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2',
                  message.role === MessageRole.USER
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.role === MessageRole.USER && (
                <Avatar className="size-8">
                  <AvatarFallback className="bg-secondary">
                    <User className="size-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="size-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      { }
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
