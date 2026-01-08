'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { MessageRole, type AiMessage, type AiSource, type MessageMetadata } from '@/lib/types/conversations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Flexible message interface for UI display (handles both persisted and optimistic messages)
export interface UiMessage {
  role: MessageRole;
  content: string;
  sentAt?: string;
  timestamp?: string; // Legacy support
  metadata?: MessageMetadata;
  sources?: AiSource[];
  id?: string; // Optional for optimistic updates
  isError?: boolean;
}

interface AiChatInterfaceProps {
  messages: UiMessage[];
  onSendMessage: (content: string) => Promise<void>;
  loading?: boolean;
  botName?: string;
  modelName?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

const formatTime = (timestamp?: string) => {
  if (!timestamp) return '';
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

const MessageItem = React.memo(({ message, index, botName, onCopy, copiedIndex }: {
  message: UiMessage,
  index: number,
  botName?: string,
  onCopy: (content: string, index: number) => void,
  copiedIndex: number | null
}) => {
  return (
    <div
      className={cn(
        'flex gap-5',
        message.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform hover:scale-105',
        message.role === MessageRole.ASSISTANT
          ? 'bg-gradient-to-br from-primary to-primary/60 text-primary-foreground'
          : 'bg-gradient-to-br from-zinc-700 to-zinc-900 text-white'
      )}>
        {message.role === MessageRole.ASSISTANT ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>

      <div className={cn(
        'flex flex-col gap-2 max-w-[85%]',
        message.role === MessageRole.USER ? 'items-end' : 'items-start'
      )}>
        <div className={cn(
          'group relative px-5 py-4 rounded-3xl shadow-sm border transition-all',
          message.role === MessageRole.USER
            ? 'bg-primary text-primary-foreground border-primary/20 rounded-tr-none'
            : cn(
              'bg-card border-border/50 rounded-tl-none hover:border-border hover:shadow-md',
              message.isError && 'border-destructive/30 bg-destructive/5'
            )
        )}>
          {message.role === MessageRole.ASSISTANT && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/10">
              <span className="font-bold text-xs uppercase tracking-wider opacity-80">
                {message.metadata?.bot || botName}
              </span>
              {message.metadata?.model && (
                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/10 border-primary/20 text-primary">
                  {String(message.metadata.model)}
                </Badge>
              )}
            </div>
          )}

          <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed break-words">
            {message.role === MessageRole.ASSISTANT ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: { node?: unknown, inline?: boolean, className?: string, children?: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
                    return !inline ? (
                      <div className="relative my-4 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
                          <span className="text-xs text-zinc-400">Code</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white" onClick={() => navigator.clipboard.writeText(String(children))}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <pre className="p-4 overflow-x-auto text-sm text-zinc-100 font-mono">
                          <code {...props} className={className}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-zinc-800/50 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          {/* RAG Sources Display */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Sources
              </p>
              <div className="grid gap-2">
                {message.sources.map((source: AiSource, idx: number) => (
                  <div key={idx} className="bg-background/40 hover:bg-background/80 transition-colors border border-border/30 rounded-lg p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-primary truncate">
                        {String(source.metadata?.title || source.documentId || `Source ${idx + 1}`)}
                      </span>
                      {source.score && (
                        <Badge variant="secondary" className="h-4 text-[9px] px-1">
                          {Math.round(source.score * 100)}% Match
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground/80 line-clamp-2 leading-relaxed">
                      {source.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase">
            {formatTime(message.sentAt || message.timestamp)}
          </span>
          <button
            onClick={() => onCopy(message.content, index)}
            className="text-muted-foreground/40 hover:text-primary transition-colors"
          >
            {copiedIndex === index ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  // Custom comparison for performance
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.role === next.message.role &&
    prev.copiedIndex === next.copiedIndex &&
    prev.index === next.index // Index check for copied state reference
  );
});
MessageItem.displayName = 'MessageItem';

export function AiChatInterface({
  messages,
  onSendMessage,
  loading = false,
  botName = 'AI Assistant',
  modelName,
  className,
  title,
  subtitle,
  headerActions
}: AiChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || sending || loading) return;

    const message = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
    <div className={cn('flex flex-col flex-1 bg-background/50 backdrop-blur-sm transition-all duration-500 overflow-hidden', className)}>
      {/* Integrated Header - Senior Standard */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/40 backdrop-blur-md z-30">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {title || botName}
          </h1>
          {subtitle && (
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {headerActions}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          {messages.length === 0 ? (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 mb-10 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 flex items-center justify-center shadow-2xl shadow-primary/20 relative group">
                <div className="absolute inset-0 rounded-3xl bg-primary opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <Bot className="w-12 h-12 text-primary-foreground relative z-10" />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                {botName || 'Wata AI Assistant'}
              </h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                Empowering your workspace with intelligent automation. Ask me anything to get started.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-12 w-full max-w-xl">
                {[
                  "How do I create a new bot?",
                  "Show me my current analytics",
                  "Help me configure knowledge base",
                  "What are the latest updates?"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="p-4 rounded-2xl border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all text-sm text-left font-medium group"
                  >
                    <span className="group-hover:text-primary transition-colors">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (


            // ... inside main component map ...
            messages.map((message, index) => (
              <MessageItem
                key={index}
                index={index}
                message={message}
                botName={botName}
                onCopy={handleCopy}
                copiedIndex={copiedIndex}
              />
            ))
          )}

          {(loading || sending) && (
            <div className="flex gap-5">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 max-w-[85%]">
                <div className="rounded-3xl rounded-tl-none p-5 bg-card border border-border/30">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Input Area - ChatGPT Style */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <div className="max-w-7xl mx-auto relative group">
          <div className="relative flex items-end w-full p-2 bg-card border border-border/60 rounded-[28px] shadow-2xl transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 hover:border-border">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message Wata AI..."
              className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-base max-h-[200px] min-h-[44px] overflow-y-auto"
              rows={1}
              disabled={sending || loading}
            />

            <div className="pb-1.5 pr-1.5 flex items-center gap-2">
              {input.trim() ? (
                <Button
                  onClick={handleSend}
                  disabled={sending || loading}
                  size="icon"
                  className="h-9 w-9 rounded-2xl transition-all shadow-lg shadow-primary/20"
                >
                  {sending || loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="h-9 w-9 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/40">
                  <Send className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
