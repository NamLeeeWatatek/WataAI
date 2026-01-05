import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI, Tool } from '@google/generative-ai';
import { OpenAI, ClientOptions } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage } from '../domain/ai-provider';

@Injectable()
export class AiModelService {
    private readonly logger = new Logger(AiModelService.name);

    async chatWithGoogleHistory(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        useTools?: boolean,
    ): Promise<string> {
        const genAI = new GoogleGenerativeAI(apiKey);
        const chat = genAI.getGenerativeModel({ model });

        const systemMessage = messages.find((m) => m.role === 'system');
        const relevantMessages = messages.filter(m => m.role !== 'system');
        if (relevantMessages.length === 0) return '';

        const lastMessage = relevantMessages[relevantMessages.length - 1];
        const historyMessages = relevantMessages.slice(0, -1);

        const history = historyMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const tools: Tool[] | undefined = useTools
            ? ([{ googleSearch: {} }] as unknown as Tool[])
            : undefined;

        const chatSession = chat.startChat({
            history,
            systemInstruction: systemMessage?.content,
            tools: tools,
        });

        const result = await chatSession.sendMessage(lastMessage.content);
        return result.response.text();
    }

    async chatWithOpenAIHistory(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
        baseURL?: string,
    ): Promise<string> {
        const clientConfig: ClientOptions = { apiKey };
        if (baseURL) {
            clientConfig.baseURL = baseURL.endsWith('/v1')
                ? baseURL
                : `${baseURL.replace(/\/$/, '')}/v1`;
        }
        const openai = new OpenAI(clientConfig);

        try {
            const sanitizedMessages = messages.map((m) => ({
                role: m.role,
                content: m.content || ''
            }));

            const response = await openai.chat.completions.create({
                model,
                messages: sanitizedMessages,
            });
            return response.choices[0]?.message?.content || '';
        } catch (error) {
            this.logger.error(`OpenAI Chat Error: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`OpenAI Error: ${error.message}`);
        }
    }

    async chatWithAnthropicHistory(
        messages: ChatMessage[],
        model: string,
        apiKey: string,
    ): Promise<string> {
        const anthropic = new Anthropic({ apiKey });

        const systemMessage = messages.find((m) => m.role === 'system');
        const chatMessages = messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content || ' '
            }));

        // Anthropic requires strictly alternating roles
        const sanitizedMessages: { role: 'user' | 'assistant'; content: string }[] = [];
        if (chatMessages.length > 0) {
            sanitizedMessages.push(chatMessages[0]);
            for (let i = 1; i < chatMessages.length; i++) {
                const prev = sanitizedMessages[sanitizedMessages.length - 1];
                const curr = chatMessages[i];
                if (prev.role === curr.role) {
                    prev.content += `\n\n${curr.content}`;
                } else {
                    sanitizedMessages.push(curr);
                }
            }
        }

        if (sanitizedMessages.length > 0 && sanitizedMessages[0].role !== 'user') {
            sanitizedMessages.unshift({ role: 'user', content: 'Context:' });
        }

        try {
            const response = await anthropic.messages.create({
                model,
                max_tokens: 4096,
                system: systemMessage?.content,
                messages: sanitizedMessages,
            });
            const content = response.content[0];
            return content.type === 'text' ? content.text : '';
        } catch (error) {
            this.logger.error(`Anthropic Chat Error: ${error.message}`, error.stack);
            throw new InternalServerErrorException(`Anthropic Error: ${error.message}`);
        }
    }

    async chatWithOllamaHistory(
        messages: ChatMessage[],
        model: string,
        baseURL?: string,
        apiKey?: string,
    ): Promise<string> {
        const url = baseURL || 'http://localhost:11434';

        if (url.endsWith('/v1') || url.endsWith('/v1/')) {
            return this.chatWithOpenAIHistory(messages, model, apiKey || 'no-key-required', url);
        }

        const nativeBaseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const hasProtocol = nativeBaseUrl.startsWith('http://') || nativeBaseUrl.startsWith('https://');
        const validUrl = hasProtocol ? nativeBaseUrl : `http://${nativeBaseUrl}`;
        const endpoint = `${validUrl}/api/chat`;

        try {
            const parsedUrl = new URL(endpoint);
            const hostHeader = parsedUrl.host;

            const sanitizedMessages = messages.map(m => ({
                role: m.role,
                content: m.content || ''
            }));

            const body = {
                model,
                messages: sanitizedMessages,
                stream: false,
                options: { num_ctx: 4096 }
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Host': hostHeader,
            };

            if (apiKey && apiKey !== 'no-key-required') {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data.message?.content || '';
        } catch (error) {
            if (error.message?.includes('not found')) {
                throw new BadRequestException(`Model '${model}' not found on Ollama server.`);
            }
            throw new InternalServerErrorException(`Ollama Error: ${error.message}`);
        }
    }

    async verifyConnection(providerKey: string, config: Record<string, any>): Promise<void> {
        try {
            const key = providerKey.toLowerCase();

            if (key === 'anthropic') {
                const anthropic = new Anthropic({ apiKey: config.apiKey });
                await anthropic.messages.create({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1,
                    messages: [{ role: 'user', content: 'Hi' }],
                });
                return;
            }

            if (key === 'google') {
                const genAI = new GoogleGenerativeAI(config.apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                await model.generateContent('Hi');
                return;
            }

            // Generic / OpenAI Compatible (OpenAI, Ollama, Custom)
            let baseURL = config.baseURL;
            let apiKey = config.apiKey;

            if (key === 'ollama') {
                let url = config.baseURL || 'http://127.0.0.1:11434';

                // Helper to try fetching
                const checkOllama = async (checkUrl: string) => {
                    this.logger.debug(`Verifying Ollama connection at: ${checkUrl}`);
                    if (!checkUrl.endsWith('/v1') && !checkUrl.endsWith('/v1/')) {
                        const nativeBaseUrl = checkUrl.endsWith('/') ? checkUrl.slice(0, -1) : checkUrl;
                        const hasProtocol = nativeBaseUrl.startsWith('http://') || nativeBaseUrl.startsWith('https://');
                        const validUrl = hasProtocol ? nativeBaseUrl : `http://${nativeBaseUrl}`;
                        const endpoint = `${validUrl}/api/tags`; // /api/tags is a lightweight check

                        const response = await fetch(endpoint);
                        if (!response.ok) throw new Error(`Ollama connection failed: ${response.statusText}`);
                        return true;
                    }
                    return false; // Let it fall through to /v1 check
                };

                try {
                    const isNative = await checkOllama(url);
                    if (isNative) return;
                } catch (error) {
                    this.logger.warn(`Initial Ollama check failed for ${url}: ${error.message}`);
                    // Fallback: If localhost failed, try 127.0.0.1
                    if (url.includes('localhost')) {
                        const altUrl = url.replace('localhost', '127.0.0.1');
                        try {
                            const isNative = await checkOllama(altUrl);
                            if (isNative) {
                                // Update baseURL for next steps if we found a working native endpoint
                                // But if it was native, we returned above.
                                // If we are here, it means checkOllama threw or returned false.
                                // Actually 'checkOllama' returns true if native success.
                                return;
                            }
                            // If it returned false (meaning it looks like v1 path), we update url
                            url = altUrl;
                        } catch (retryError) {
                            // Try host.docker.internal as last resort for Docker environments
                            const dockerUrl = url.replace('localhost', 'host.docker.internal');
                            try {
                                const isNative = await checkOllama(dockerUrl);
                                if (isNative) return;
                                url = dockerUrl;
                            } catch (finalError) {
                                throw error;
                            }
                        }
                    } else {
                        throw error;
                    }
                }
                baseURL = url;
            }

            if (baseURL && !apiKey) {
                apiKey = 'no-key-required';
            }

            // Sanitization for OpenAI Client (which uses node-fetch)
            if (baseURL && baseURL.includes('localhost')) {
                baseURL = baseURL.replace('localhost', '127.0.0.1');
            }

            const clientConfig: ClientOptions = { apiKey };
            if (baseURL) clientConfig.baseURL = baseURL;

            const client = new OpenAI(clientConfig);
            await client.models.list();
        } catch (error) {
            this.logger.error(`Connection verification failed for ${providerKey}: ${error.message}`);
            // Re-throw with clean message
            throw new Error(`Verification failed: ${error.message}`);
        }
    }

    async fetchRemoteModels(providerKey: string, config: Record<string, any>): Promise<string[]> {
        try {
            const key = providerKey.toLowerCase();

            if (key === 'openai') {
                const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
                const list = await client.models.list();
                return list.data.map((m) => m.id);
            }

            if (key === 'anthropic') {
                return ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
            }

            if (key === 'google') {
                return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
            }

            if (key === 'ollama') {
                const url = config.baseUrl || 'http://127.0.0.1:11434';
                const nativeBaseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
                const hasProtocol = nativeBaseUrl.startsWith('http://') || nativeBaseUrl.startsWith('https://');
                const validUrl = hasProtocol ? nativeBaseUrl : `http://${nativeBaseUrl}`;
                const endpoint = `${validUrl}/api/tags`;

                let response;
                try {
                    response = await fetch(endpoint);
                } catch (error) {
                    if (validUrl.includes('localhost')) {
                        // Retry with 127.0.0.1
                        const altEndpoint = endpoint.replace('localhost', '127.0.0.1');
                        response = await fetch(altEndpoint);
                    } else {
                        throw error;
                    }
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch Ollama models: ${response.statusText}`);
                }
                const data = await response.json();
                return data.models?.map((m: { name: string }) => m.name) || [];
            }

            return [];
        } catch (error) {
            this.logger.warn(`Failed to fetch models for ${providerKey}: ${error.message}`);
            return [];
        }
    }

    async generateEmbedding(
        text: string,
        providerKey: string,
        model: string,
        apiKey?: string,
        baseUrl?: string,
    ): Promise<number[]> {
        const key = providerKey.toLowerCase();

        try {
            if (key === 'openai') {
                const client = new OpenAI({ apiKey, baseURL: baseUrl });
                const response = await client.embeddings.create({
                    model,
                    input: text,
                });
                return response.data[0].embedding;
            }

            if (key === 'google') {
                const genAI = new GoogleGenerativeAI(apiKey || '');
                const embedModel = genAI.getGenerativeModel({ model });
                const result = await embedModel.embedContent(text);
                return result.embedding.values;
            }

            if (key === 'ollama') {
                const url = baseUrl || 'http://127.0.0.1:11434';

                // Handle /v1 OpenAI compability mode
                if (url.endsWith('/v1') || url.endsWith('/v1/')) {
                    const client = new OpenAI({ apiKey: apiKey || 'ollama', baseURL: url });
                    const response = await client.embeddings.create({
                        model,
                        input: text,
                    });
                    return response.data[0].embedding;
                }

                // Sanitize URL
                const nativeBaseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
                const hasProtocol = nativeBaseUrl.startsWith('http://') || nativeBaseUrl.startsWith('https://');
                const validUrl = hasProtocol ? nativeBaseUrl : `http://${nativeBaseUrl}`;

                const endpoint = `${validUrl}/api/embeddings`;

                const makeRequest = async (ep: string) => {
                    return fetch(ep, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model, prompt: text }),
                    });
                }

                let response = await makeRequest(endpoint).catch(async (err) => {
                    if (validUrl.includes('localhost')) {
                        const altEndpoint = endpoint.replace('localhost', '127.0.0.1');
                        return await makeRequest(altEndpoint);
                    }
                    throw err;
                });

                if (!response.ok) {
                    throw new Error(`Ollama Embedding Error: ${response.status} ${response.statusText} - ${await response.text()}`);
                }

                const data = await response.json();
                return data.embedding;
            }
        } catch (error) {
            this.logger.error(`Embedding generation failed for ${key}: ${error.message}`);
            throw error;
        }

        this.logger.warn(`Embedding not supported for provider ${providerKey}`);
        return [];
    }

    async generateSystemPrompt(params: {
        userId: string;
        description: string;
        template?: string;
        providerConfigId?: string;
        tone?: string;
        style?: string;
        additionalContext?: Record<string, any>;
    }): Promise<{ prompt: string; improvements: string[]; suggestions: string[] }> {
        this.logger.log(`Generating system prompt for user ${params.userId}`);

        const toneString = params.tone ? ` The response should be ${params.tone}.` : '';
        const styleString = params.style ? ` Write in a ${params.style} style.` : '';
        const contextString = params.additionalContext ? ` Additional Context: ${JSON.stringify(params.additionalContext)}` : '';

        // Heuristic-based prompt construction
        const basePrompt = params.template || `You are an AI assistant designed to: ${params.description}.${toneString}${styleString}${contextString}`;

        const prompt = basePrompt.trim();

        // Simulate AI improvements analysis
        const improvements = [
            'Refined goal clarity based on description',
            params.tone ? 'Integrated tone requirements' : 'Standardized professional tone',
            params.style ? 'Applied specific writing style' : 'Optimized for conversational flow'
        ];

        const suggestions = [
            'Add more specific examples to the description for better grounding',
            'Consider defining explicit constraints (what NOT to do)',
            'Include a few-shot examples of ideal responses'
        ];

        return {
            prompt,
            improvements,
            suggestions,
        };
    }
}
