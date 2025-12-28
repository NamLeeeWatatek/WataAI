'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { Bot, Settings, Zap, MessageSquare, Copy, Check, Sparkles, Lightbulb, Rocket, Wand2, Cpu, TrendingUp, Headphones, BookOpen, Code } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';
import axiosClient from '@/lib/axios-client';
import { Badge } from '@/components/ui/Badge';

interface BotConfigData {
    name: string;
    description: string;
    systemPrompt: string;
    aiProviderId?: string;
    aiModelName: string;
    aiParameters: {
        temperature: number;
        max_tokens: number;
    };
    enableAutoLearn: boolean;
}

interface BasicInfoSectionProps {
    data: BotConfigData;
    onChange: (data: Partial<BotConfigData>) => void;
}

export function BasicInfoSection({ data, onChange }: BasicInfoSectionProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    <CardTitle>Basic Information</CardTitle>
                </div>
                <CardDescription>
                    Configure your bot's name and description
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="bot-name">Bot Name *</Label>
                    <Input
                        id="bot-name"
                        value={data.name}
                        onChange={(e) => onChange({ name: e.target.value })}
                        placeholder="Customer Support Bot"
                    />
                    <p className="text-xs text-muted-foreground">
                        This name will be displayed to users
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bot-description">Description</Label>
                    <Textarea
                        id="bot-description"
                        value={data.description}
                        onChange={(e) => onChange({ description: e.target.value })}
                        placeholder="A helpful bot that assists customers with their questions"
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                        Brief description of what your bot does
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

interface SystemPromptSectionProps {
    systemPrompt: string;
    onChange: (systemPrompt: string) => void;
    aiConfig?: {
        providerId?: string;
        modelName?: string;
        parameters?: {
            temperature: number;
            max_tokens: number;
        };
    };
}

export function SystemPromptSection({ systemPrompt, onChange, aiConfig }: SystemPromptSectionProps) {
    const [showExamples, setShowExamples] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [quickDescription, setQuickDescription] = useState('');
    const [generatedResult, setGeneratedResult] = useState<{
        prompt: string;
        improvements: string[];
        suggestions: string[];
    } | null>(null);

    const quickGenerationOptions = [
        {
            id: 'marketing',
            title: 'Marketing AI',
            description: 'Sales, marketing, and business assistant',
            icon: TrendingUp,
            prompt: 'I want a marketing AI that helps with sales, campaigns, and business growth'
        },
        {
            id: 'support',
            title: 'Customer Support',
            description: 'Help customers with questions and issues',
            icon: Headphones,
            prompt: 'I want a customer support AI that handles customer inquiries and provides help'
        },
        {
            id: 'technical',
            title: 'Technical Assistant',
            description: 'Programming, coding, and technical support',
            icon: Code,
            prompt: 'I want a technical assistant that helps with programming and technical questions'
        },
        {
            id: 'teacher',
            title: 'Education Assistant',
            description: 'Teaching, learning, and educational support',
            icon: BookOpen,
            prompt: 'I want an education assistant that helps with learning and teaching'
        },
        {
            id: 'creative',
            title: 'Creative Assistant',
            description: 'Writing, content creation, and ideation',
            icon: Lightbulb,
            prompt: 'I want a creative assistant that helps with writing and content creation'
        },
    ];

    const templateExamples = [
        {
            title: 'Customer Support',
            icon: Headphones,
            prompt: `You are a friendly and professional customer support assistant. Your role is to:
- Help customers with their questions and concerns
- Provide accurate information about products and services
- Escalate complex issues to human agents when needed
- Always maintain a polite and helpful tone

If you don't know the answer, say so honestly and offer to connect them with a human agent.`,
        },
        {
            title: 'Sales Assistant',
            icon: TrendingUp,
            prompt: `You are an enthusiastic sales assistant. Your goals are to:
- Understand customer needs and recommend suitable products
- Highlight key features and benefits
- Answer questions about pricing and availability
- Guide customers through the purchase process

Be helpful but not pushy. Focus on solving customer problems.`,
        },
        {
            title: 'Technical Support',
            icon: Code,
            prompt: `You are a technical support specialist. Your responsibilities include:
- Diagnosing technical issues
- Providing step-by-step troubleshooting guidance
- Explaining technical concepts in simple terms
- Documenting solutions for future reference

Always ask clarifying questions to understand the issue better.`,
        },
        {
            title: 'Creative Writer',
            icon: Lightbulb,
            prompt: `You are a skilled creative writer and content strategist. Your expertise includes:
- Crafting compelling narratives and engaging content
- Adapting writing style to different audiences and purposes
- Brainstorming creative ideas and concepts
- Providing constructive feedback on writing quality

Focus on being inspiring while maintaining clarity and professionalism.`,
        },
        {
            title: 'Education Tutor',
            icon: BookOpen,
            prompt: `You are an experienced educational tutor and learning facilitator. Your approach includes:
- Breaking down complex topics into understandable concepts
- Using examples and analogies to explain ideas
- Adapting explanations to different learning levels
- Encouraging questions and active learning

Always make learning accessible and engaging for your students.`,
        },
    ];

    const handleGenerateFromDescription = async () => {
        if (!quickDescription.trim()) {
            toast.error('Please enter a description for your bot');
            return;
        }

        if (!aiConfig?.providerId) {
            toast.error('Please configure an AI provider first in the "AI Config" tab');
            return;
        }

        setGenerating(true);
        try {
            const response = await axiosClient.post('/ai-providers/generate-prompt', {
                description: quickDescription,
                config: {
                    providerId: aiConfig.providerId,
                    model: aiConfig.modelName,
                    temperature: aiConfig.parameters?.temperature,
                    maxTokens: aiConfig.parameters?.max_tokens
                }
            });

            const result = (response as any).data || response;
            setGeneratedResult(result);

            // Auto-fill the system prompt
            if (result.prompt) {
                onChange(result.prompt);
                toast.success('AI-generated prompt applied!');
            }
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                'Failed to generate prompt. Please check your AI provider settings.'
            );
        } finally {
            setGenerating(false);
        }
    };

    const handleQuickGeneration = async (prompt: string) => {
        setQuickDescription(prompt);

        if (!aiConfig?.providerId) {
            // If no provider is selected, we can't use AI generation
            toast.error('Please configure an AI provider first to use AI generation');
            // Suggest utilizing fallback or templates explicitly?
            // For now, let's allow fallback if user really wants, or just block?
            // The user request emphasizes calling AI from config, so blocking seems appropriate to enforce usage.
            // But let's check if we should fallback silently?
            // "khi sài ai suggest là nó gọi AI từ việc config ai provider luôn á chứ ko phỉa là dùng tempalte mẫu"
            // Translation: "Not using a sample template"

            // So we should NOT use fallback.
            return;
        }

        setGenerating(true);
        try {
            const response = await axiosClient.post('/ai-providers/generate-prompt', {
                description: prompt,
                config: {
                    providerId: aiConfig.providerId,
                    model: aiConfig.modelName,
                    temperature: aiConfig.parameters?.temperature,
                    maxTokens: aiConfig.parameters?.max_tokens
                }
            });

            const result = (response as any).data || response;
            setGeneratedResult(result);

            // Auto-fill the system prompt
            if (result.prompt) {
                onChange(result.prompt);
                toast.success(`"${result.prompt.substring(0, 50)}..." generated and applied!`);
            }
        } catch (error: any) {
            console.error('AI Generation Error:', error);
            toast.error(
                error?.response?.data?.message ||
                'Failed to generate prompt via AI Provider.'
            );
        } finally {
            setGenerating(false);
        }
    };

    // Fallback prompt generation (same logic as backend)
    const generateFallbackPrompt = (description: string): string => {
        const desc = description.toLowerCase();

        if (desc.includes('marketing') || desc.includes('sales') || desc.includes('business')) {
            return `You are an expert marketing assistant specializing in digital marketing, sales strategies, and business growth. Your responsibilities include:

- Provide actionable marketing advice and strategies
- Help create compelling copy and content
- Assist with market research and competitive analysis
- Focus on conversion optimization and ROI
- Maintain a professional, results-oriented communication style

When giving advice, be specific and provide clear next steps. Always consider the user's business goals and target audience.`;
        }

        if (desc.includes('programming') || desc.includes('developer') || desc.includes('code') || desc.includes('software')) {
            return `You are an expert software developer and technical consultant. Your expertise includes:

- Multiple programming languages and frameworks
- System architecture and design patterns
- Debugging and performance optimization
- Best practices and code quality
- Technology evaluation and recommendations

Provide detailed technical explanations, code examples when helpful, and practical solutions. Ask clarifying questions when context is insufficient.`;
        }

        if (desc.includes('customer') || desc.includes('support') || desc.includes('service') || desc.includes('help')) {
            return `You are a friendly and professional customer support specialist. Your role is to:

- Help customers with their questions and concerns
- Provide accurate information about products and services
- Escalate complex issues to appropriate teams when needed
- Maintain a polite, helpful, and patient communication style

If you don't know the answer to a question, say so honestly and offer to connect them with a human representative.`;
        }

        if (desc.includes('teaching') || desc.includes('learning') || desc.includes('education') || desc.includes('training')) {
            return `You are an experienced educator and learning facilitator. Your approach includes:

- Breaking down complex topics into understandable concepts
- Using examples and analogies to explain ideas
- Adapting explanations to different learning levels
- Encouraging questions and curiosity
- Providing clear, step-by-step guidance

Make learning engaging and accessible. Tailor your explanations to the learner's current knowledge and goals.`;
        }

        return `You are a helpful and knowledgeable AI assistant specializing in ${description}. Your characteristics include:

- Friendly and approachable communication style
- Deep knowledge in your area of specialization
- Providing accurate, detailed, and actionable responses
- Asking clarifying questions when needed
- Staying focused on helping users achieve their goals

Always provide well-reasoned responses and suggest next steps when appropriate.`;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <CardTitle>AI System Prompt</CardTitle>
                        </div>
                        <CardDescription>
                            Define your bot's personality and behavior with AI-powered generation
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowExamples(!showExamples)}
                        >
                            {showExamples ? 'Hide' : 'Templates'}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Quick Generation */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm">Quick Generation</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {quickGenerationOptions.map((option) => (
                            <Button
                                key={option.id}
                                variant="outline"
                                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5 min-h-[100px] w-full"
                                onClick={() => handleQuickGeneration(option.prompt)}
                                disabled={generating}
                            >
                                <option.icon className="w-6 h-6 text-primary flex-shrink-0" />
                                <div className="text-center flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate w-full">{option.title}</div>
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-tight">
                                        {option.description}
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Or describe what you want your AI to do... (e.g., 'I want a marketing AI')"
                            value={quickDescription}
                            onChange={(e) => setQuickDescription(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !generating) {
                                    handleGenerateFromDescription();
                                }
                            }}
                        />
                        <Button
                            onClick={handleGenerateFromDescription}
                            disabled={!quickDescription.trim() || generating}
                        >
                            {generating ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Generating...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Generate</span>
                                </div>
                            )}
                        </Button>
                    </div>


                </div>

                {/* Template Examples */}
                {showExamples && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Rocket className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">Template Examples</h3>
                        </div>

                        <div className="grid gap-3">
                            {templateExamples.map((template) => (
                                <div
                                    key={template.title}
                                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all hover:shadow-sm"
                                    onClick={() => onChange(template.prompt)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                            <template.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-sm truncate">{template.title}</h4>
                                                <Badge variant="outline" className="text-xs">
                                                    Use Template
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {template.prompt.split('\n\n')[0]}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Manual Editor */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label htmlFor="system-prompt">Manual Editor</Label>
                        <Textarea
                            id="system-prompt"
                            value={systemPrompt}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="You are a helpful assistant that..."
                            rows={12}
                            className="font-mono text-sm resize-none"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{systemPrompt.length} characters</span>
                            <span className="flex items-center gap-1">
                                <Cpu className="w-3 h-3" />
                                Use AI generation above for better results
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface AIConfigSectionProps {
    data: BotConfigData;
    onChange: (data: Partial<BotConfigData>) => void;
}

export function AIConfigSection({ data, onChange }: AIConfigSectionProps) {
    const [providers, setProviders] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [fetchingModels, setFetchingModels] = React.useState(false);

    React.useEffect(() => {
        const loadProviders = async () => {
            try {
                const response = await axiosClient.get('/ai-providers/user/configs');
                // Only show active and verified providers
                // For now, consider active providers as verified (will be improved with proper verification logic)
                const activeProviders = ((response as unknown) as any[]).filter((p: any) => p.isActive);
                setProviders(activeProviders);
            } catch (error) {
                console.error('Failed to load AI providers:', error);
                toast.error('Failed to load AI providers');
            } finally {
                setLoading(false);
            }
        };
        loadProviders();
    }, []);

    const fetchModelsForProvider = async (configId: string) => {
        setFetchingModels(true);
        try {
            const models = await axiosClient.get(`/ai-providers/fetch-models/${configId}/user`);
            // Update the provider's modelList in state
            setProviders(prevProviders =>
                prevProviders.map(provider =>
                    provider.id === configId
                        ? { ...provider, modelList: models }
                        : provider
                )
            );
        } catch (error) {
            console.error('Failed to fetch models:', error);
            toast.error('Failed to load available models');
        } finally {
            setFetchingModels(false);
        }
    };

    const handleProviderChange = async (configId: string) => {
        const provider = providers.find(p => p.id === configId);
        if (provider) {
            // If provider doesn't have models yet, fetch them
            if (!provider.modelList || provider.modelList.length === 0) {
                await fetchModelsForProvider(configId);
            }
            // Update the provider and set first available model
            const updatedProviders = providers.map(p =>
                p.id === configId ? { ...p, modelList: p.modelList || [] } : p
            );
            const selectedProvider = updatedProviders.find(p => p.id === configId);
            onChange({
                aiProviderId: configId,
                aiModelName: selectedProvider?.modelList?.[0] || ''
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <CardTitle>AI Configuration</CardTitle>
                </div>
                <CardDescription>
                    Configure the AI model and parameters
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {providers.length === 0 && !loading && (
                    <div className="p-4 border border-dashed rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground text-center">
                            No AI providers configured.
                            <a href="/settings" className="text-primary hover:underline ml-1">
                                Add one in Settings
                            </a>
                        </p>
                    </div>
                )}

                {providers.length > 0 && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="ai-provider">AI Provider *</Label>
                            <Select
                                value={data.aiProviderId}
                                onValueChange={handleProviderChange}
                                disabled={loading}
                            >
                                <SelectTrigger id="ai-provider">
                                    <SelectValue placeholder={loading ? "Loading providers..." : "Select a provider"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {providers.map((provider) => (
                                        <SelectItem key={provider.id} value={provider.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{provider.displayName}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {provider.provider?.key || provider.providerId}
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Select which AI provider to use for this bot
                            </p>
                        </div>

                        {data.aiProviderId && (
                            <div className="space-y-2">
                                <Label htmlFor="ai-model">AI Model *</Label>
                                <Select
                                    value={data.aiModelName}
                                    onValueChange={(value) => onChange({ aiModelName: value })}
                                    disabled={fetchingModels}
                                >
                                    <SelectTrigger id="ai-model">
                                        <SelectValue placeholder={
                                            fetchingModels ? "Loading models..." :
                                                data.aiModelName ? data.aiModelName : "Select a model"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(() => {
                                            const provider = providers.find(p => p.id === data.aiProviderId);
                                            const models = provider?.modelList || [];

                                            if (fetchingModels) {
                                                return (
                                                    <SelectItem value="loading" disabled>
                                                        Loading models...
                                                    </SelectItem>
                                                );
                                            }

                                            if (models.length === 0) {
                                                return (
                                                    <SelectItem value="none" disabled>
                                                        No models available
                                                    </SelectItem>
                                                );
                                            }

                                            return models.map((model: string) => (
                                                <SelectItem key={model} value={model}>
                                                    {model}
                                                </SelectItem>
                                            ));
                                        })()}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Choose the specific model to use
                                </p>
                            </div>
                        )}
                    </>
                )}

                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">Model Parameters</h4>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="temperature">Temperature</Label>
                                <span className="text-sm font-mono text-muted-foreground">
                                    {data.aiParameters.temperature.toFixed(1)}
                                </span>
                            </div>
                            <Slider
                                id="temperature"
                                min={0}
                                max={2}
                                step={0.1}
                                value={[data.aiParameters.temperature]}
                                onValueChange={([value]) =>
                                    onChange({
                                        aiParameters: { ...data.aiParameters, temperature: value },
                                    })
                                }
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Precise (0.0)</span>
                                <span>Balanced (1.0)</span>
                                <span>Creative (2.0)</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Lower values make responses more focused and deterministic
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max-tokens">Max Response Length</Label>
                            <Input
                                id="max-tokens"
                                type="number"
                                min={100}
                                max={4000}
                                step={100}
                                value={data.aiParameters.max_tokens}
                                onChange={(e) =>
                                    onChange({
                                        aiParameters: {
                                            ...data.aiParameters,
                                            max_tokens: parseInt(e.target.value) || 1000,
                                        },
                                    })
                                }
                            />

                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

interface AdvancedSettingsSectionProps {
    enableAutoLearn: boolean;
    isActive: boolean;
    botId: string;
    onToggleAutoLearn: (enabled: boolean) => void;
    onToggleActive: (active: boolean) => void;
}

export function AdvancedSettingsSection({
    enableAutoLearn,
    isActive,
    botId,
    onToggleAutoLearn,
    onToggleActive,
}: AdvancedSettingsSectionProps) {
    const [copied, setCopied] = useState(false);
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/bots/${botId}`;

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Link copied to clipboard!');
        } catch {
            toast.error('Failed to copy link');
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    <CardTitle>Advanced Settings</CardTitle>
                </div>
                <CardDescription>
                    Additional configuration options
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                        <Label htmlFor="auto-learn" className="cursor-pointer font-medium">
                            Auto-Learn from Conversations
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Bot learns and improves from user interactions
                        </p>
                    </div>
                    <Switch
                        id="auto-learn"
                        checked={enableAutoLearn}
                        onCheckedChange={onToggleAutoLearn}
                    />
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="is-active" className="cursor-pointer font-medium">
                                Public Access
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Make bot accessible via public link
                            </p>
                        </div>
                        <Switch
                            id="is-active"
                            checked={isActive}
                            onCheckedChange={onToggleActive}
                        />
                    </div>

                    {isActive && (
                        <div className="mt-4 space-y-2">
                            <Label className="text-sm">Public Share Link</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={shareUrl}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyShareLink}
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
