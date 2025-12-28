'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { MessageRole } from '@/lib/types/conversations';

export interface AiMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: {
    bot?: string;
    model?: string;
    sources?: any[];
  };
}

interface AiChatInterfaceProps {
  messages: AiMessage[];
  onSendMessage: (content: string) => Promise<void>;
  loading?: boolean;
  botName?: string;
  modelName?: string;
  className?: string;
}

const formatTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export function AiChatInterface({
  messages,
  onSendMessage,
  loading = false,
  botName = 'AI Assistant',
  modelName,
  className
}: AiChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || sending || loading) return;

    const message = input.trim();
    setInput('');
    setSending(true);

    try {
      await onSendMessage(message);
    } catch (error) {
      toast.error('Failed to send message');
      setInput(message); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied!');
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-2xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">
                Start chatting with AI
              </h2>
              <p className="text-muted-foreground">
                Ask me anything! I'm here to help you test your bot configuration.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500',
                  message.role === MessageRole.USER ? 'justify-end' : 'justify-start'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {message.role === MessageRole.ASSISTANT && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div className={cn(
                  'flex-1 max-w-[80%]',
                  message.role === 'user' && 'order-first'
                )}>
                  <div className={cn(
                    'rounded-2xl p-4',
                    message.role === MessageRole.USER
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  )}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {message.role === MessageRole.USER ? 'You' : message.metadata?.bot || botName}
                        </span>
                        {message.metadata?.model && (
                          <Badge variant="secondary" className="text-xs">
                            {message.metadata.model}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">
                          {formatTime(message.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopy(message.content, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>

                {message.role === MessageRole.USER && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-600/30">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {(loading || sending) && (
              <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30 animate-pulse">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 max-w-[80%]">
                  <div className="rounded-2xl p-4 bg-muted">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        AI is thinking...
                      </span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/40 bg-background p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border/40 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[56px] max-h-[200px]"
                rows={1}
                disabled={sending || loading}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending || loading}
              size="lg"
              className="px-6 rounded-xl"
            >
              {sending || loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>

          {modelName && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Bot className="w-3 h-3" />
              <span>Chatting with {botName} using {modelName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
