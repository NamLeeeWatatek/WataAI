'use client';

import { useParams, useRouter } from 'next/navigation';
import { useBotRagChat, BotRagMessage } from '@/lib/hooks/useBotRagChat';
import { AiChatInterface } from '@/components/features/chat/AiChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Bot, Zap, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { MessageRole } from '@/lib/types/conversations';

export default function BotChatPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const {
    messages,
    loading,
    sendMessage,
    clearMessages,
    error,
  } = useBotRagChat({
    botId,
    botName: 'Test Bot',
    knowledgeBaseIds: [],
  });

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  const chatMessages: Array<{
    role: MessageRole;
    content: string;
    timestamp: string;
    metadata?: any;
  }> = messages.map((msg: BotRagMessage) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    metadata: msg.metadata,
  }));

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bots">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bots
          </Link>
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bot Chat Test</h1>
              <p className="text-muted-foreground">Testing bot-first RAG chat functionality</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <AiChatInterface
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            loading={loading}
            botName="Test Bot"
            className="h-[600px]"
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bot Configuration</CardTitle>
              <CardDescription>Test your bot's AI provider settings and KB integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">AI Provider</span>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Auto Resolved
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Knowledge Base</span>
                </div>
                <Badge variant="outline" className="bg-gray-50 text-gray-600">
                  None Connected
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bot-First Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>🔹 <strong>Bot Provider:</strong> Uses bot's configured AI provider first</p>
                <p>🔄 <strong>Fallbacks:</strong> KB Workspace → KB User → User Configs</p>
                <p>📚 <strong>RAG:</strong> Each bot can have dedicated knowledge bases</p>
                <p>🎯 <strong>Professional:</strong> No generic fallbacks, each bot has clear identity</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={clearMessages}>
                Clear Chat
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/settings">Configure Providers</Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/knowledge-base">Manage Knowledge Bases</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">AI Provider Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
