(function() {
    'use strict';

    class WataOmiWidgetCore {
        constructor(config) {
            this.config = config;
            this.isOpen = false;
            this.conversationId = null;
            this.messages = [];
            this.isLoading = false;
            this.container = null;
        }

        async init() {
            
            this.container = document.createElement('div');
            this.container.id = 'wataomi-widget-container';
            this.container.style.cssText = 'position: fixed; z-index: 999999; opacity: 0; transition: opacity 0.3s;';
            document.body.appendChild(this.container);

            this.render();

            setTimeout(() => {
                if (this.container) {
                    this.container.style.opacity = '1';
                }
            }, 50);

            await this.createConversation();
        }

        async createConversation() {
            try {
                const response = await fetch(
                    `${this.config.apiUrl}/public/bots/${this.config.botId}/conversations`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userAgent: navigator.userAgent,
                            metadata: {
                                url: window.location.href,
                                referrer: document.referrer,
                                version: this.config.version,
                            },
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    this.conversationId = data.conversationId;
                    
                    const welcomeMessage = this.config.botConfig?.welcomeMessage || 
                        'Xin chào! Tôi có thể giúp gì cho bạn?';
                    
                    this.messages.push({
                        role: 'assistant',
                        content: welcomeMessage,
                        timestamp: new Date().toISOString(),
                    });
                    
                    this.render();
                }
            } catch (error) {
            }
        }

        async sendMessage(text) {
            if (!text.trim() || this.isLoading || !this.conversationId) return;

            this.messages.push({
                role: 'user',
                content: text,
                timestamp: new Date().toISOString(),
            });
            this.isLoading = true;
            this.render();

            try {
                const response = await fetch(
                    `${this.config.apiUrl}/public/bots/conversations/${this.conversationId}/messages`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: text }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    this.messages.push({
                        role: 'assistant',
                        content: data.content,
                        timestamp: data.timestamp,
                        metadata: data.metadata,
                    });
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                this.messages.push({
                    role: 'assistant',
                    content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
                    timestamp: new Date().toISOString(),
                });
            } finally {
                this.isLoading = false;
                this.render();
            }
        }

        toggle() {
            this.isOpen = !this.isOpen;
            this.render();
        }

        render() {
            if (!this.container || !this.config.botConfig) return;

            const theme = this.config.botConfig.theme || {};
            const primaryColor = theme.primaryColor;
            const backgroundColor = theme.backgroundColor;
            const botMessageColor = theme.botMessageColor;
            const botMessageTextColor = theme.botMessageTextColor;
            const fontFamily = theme.fontFamily;
            const position = theme.position || this.config.position;
            const buttonSize = theme.buttonSize === 'large' ? '64px' : 
                              theme.buttonSize === 'small' ? '48px' : '56px';

            const positionStyles = position.includes('right') ? 'right: 20px;' : 'left: 20px;';
            const verticalStyles = position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;';

            this.container.innerHTML = `
                <style>
                    #wataomi-widget-container * { 
                        box-sizing: border-box; 
                        font-family: ${fontFamily};
                    }
                    .wataomi-button {
                        position: fixed;
                        ${positionStyles}
                        ${verticalStyles}
                        width: ${buttonSize};
                        height: ${buttonSize};
                        border-radius: 50%;
                        background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -20)} 100%);
                        border: none;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        transition: transform 0.2s, box-shadow 0.2s;
                        z-index: 999999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .wataomi-button:hover { 
                        transform: scale(1.1); 
                        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
                    }
                    .wataomi-button svg { 
                        width: 28px; 
                        height: 28px; 
                        color: white; 
                    }
                    .wataomi-window {
                        position: fixed;
                        ${positionStyles}
                        ${position.includes('bottom') ? 'bottom: calc(20px + ' + buttonSize + ' + 20px);' : 'top: calc(20px + ' + buttonSize + ' + 20px);'}
                        width: 380px;
                        max-width: calc(100vw - 40px);
                        height: 600px;
                        max-height: calc(100vh - 140px);
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                        display: ${this.isOpen ? 'flex' : 'none'};
                        flex-direction: column;
                        z-index: 999998;
                        overflow: hidden;
                    }
                    .wataomi-header {
                        background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -20)} 100%);
                        color: white;
                        padding: 16px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        flex-shrink: 0;
                    }
                    .wataomi-header-content {
                        flex: 1;
                        min-width: 0;
                    }
                    .wataomi-header h3 { 
                        margin: 0; 
                        font-size: 16px; 
                        font-weight: 600;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .wataomi-header p { 
                        margin: 4px 0 0 0; 
                        font-size: 12px; 
                        opacity: 0.9;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .wataomi-close {
                        background: rgba(255,255,255,0.2);
                        border: none;
                        border-radius: 6px;
                        padding: 6px;
                        cursor: pointer;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: background 0.2s;
                        flex-shrink: 0;
                    }
                    .wataomi-close:hover {
                        background: rgba(255,255,255,0.3);
                    }
                    .wataomi-messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 16px;
                        background: ${backgroundColor === 'transparent' ? '#ffffff' : backgroundColor};
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .wataomi-message {
                        display: flex;
                        animation: slideIn 0.3s ease-out;
                    }
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .wataomi-message.user { justify-content: flex-end; }
                    .wataomi-message.assistant { justify-content: flex-start; }
                    .wataomi-message-content {
                        max-width: 80%;
                        padding: 12px 16px;
                        border-radius: 12px;
                        font-size: 14px;
                        line-height: 1.5;
                        word-wrap: break-word;
                    }
                    .wataomi-message.user .wataomi-message-content {
                        background: ${primaryColor};
                        color: white;
                        border-radius: 12px 12px 4px 12px;
                    }
                    .wataomi-message.assistant .wataomi-message-content {
                        background: ${botMessageColor};
                        border: 1px solid ${botMessageColor === '#f3f4f6' ? '#e5e7eb' : 'rgba(0,0,0,0.1)'};
                        color: ${botMessageTextColor};
                        border-radius: 12px 12px 12px 4px;
                    }
                    .wataomi-loading {
                        display: flex;
                        gap: 6px;
                        padding: 12px 16px;
                    }
                    .wataomi-loading-dot {
                        width: 8px;
                        height: 8px;
                        background: #9ca3af;
                        border-radius: 50%;
                        animation: bounce 1.4s infinite ease-in-out both;
                    }
                    .wataomi-loading-dot:nth-child(1) { animation-delay: -0.32s; }
                    .wataomi-loading-dot:nth-child(2) { animation-delay: -0.16s; }
                    @keyframes bounce {
                        0%, 80%, 100% { transform: scale(0); }
                        40% { transform: scale(1); }
                    }
                    .wataomi-input-container {
                        padding: 16px;
                        border-top: 1px solid #e5e7eb;
                        background: white;
                        display: flex;
                        gap: 8px;
                        flex-shrink: 0;
                    }
                    .wataomi-input {
                        flex: 1;
                        padding: 10px 14px;
                        border: 1px solid #e5e7eb;
                        border-radius: 10px;
                        font-size: 14px;
                        outline: none;
                        transition: border-color 0.2s;
                    }
                    .wataomi-input:focus { 
                        border-color: ${primaryColor}; 
                    }
                    .wataomi-send {
                        padding: 10px 16px;
                        background: ${primaryColor};
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: opacity 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .wataomi-send:hover:not(:disabled) { 
                        opacity: 0.9; 
                    }
                    .wataomi-send:disabled { 
                        opacity: 0.5; 
                        cursor: not-allowed; 
                    }
                    .wataomi-version {
                        position: absolute;
                        bottom: 4px;
                        right: 8px;
                        font-size: 10px;
                        color: rgba(255,255,255,0.6);
                    }
                    
                    @media (max-width: 480px) {
                        .wataomi-window {
                            width: 100vw !important;
                            height: 100vh !important;
                            max-width: 100vw !important;
                            max-height: 100vh !important;
                            bottom: 0 !important;
                            right: 0 !important;
                            left: 0 !important;
                            top: 0 !important;
                            border-radius: 0 !important;
                        }
                    }
                </style>

                <button class="wataomi-button" id="wataomi-toggle">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${this.isOpen ? 
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>' :
                            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>'
                        }
                    </svg>
                </button>

                <div class="wataomi-window">
                    <div class="wataomi-header">
                        <div class="wataomi-header-content">
                            <h3>${this.escapeHtml(this.config.botConfig.name || 'Chat')}</h3>
                            ${this.config.botConfig.description ? 
                                `<p>${this.escapeHtml(this.config.botConfig.description)}</p>` : 
                                ''
                            }
                        </div>
                        <button class="wataomi-close" id="wataomi-close">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                        ${this.config.version ? `<div class="wataomi-version">v${this.config.version}</div>` : ''}
                    </div>

                    <div class="wataomi-messages" id="wataomi-messages">
                        ${this.messages.map(msg => `
                            <div class="wataomi-message ${msg.role}">
                                <div class="wataomi-message-content">${this.escapeHtml(msg.content)}</div>
                            </div>
                        `).join('')}
                        ${this.isLoading ? `
                            <div class="wataomi-message assistant">
                                <div class="wataomi-message-content">
                                    <div class="wataomi-loading">
                                        <div class="wataomi-loading-dot"></div>
                                        <div class="wataomi-loading-dot"></div>
                                        <div class="wataomi-loading-dot"></div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="wataomi-input-container">
                        <input 
                            type="text" 
                            class="wataomi-input" 
                            id="wataomi-input"
                            placeholder="${this.escapeHtml(this.config.botConfig.placeholderText || 'Nhập tin nhắn...')}"
                            ${this.isLoading ? 'disabled' : ''}
                        />
                        <button class="wataomi-send" id="wataomi-send" ${this.isLoading ? 'disabled' : ''}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            setTimeout(() => {
                const messagesContainer = document.getElementById('wataomi-messages');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 0);

            const toggleBtn = document.getElementById('wataomi-toggle');
            const closeBtn = document.getElementById('wataomi-close');
            const input = document.getElementById('wataomi-input');
            const sendBtn = document.getElementById('wataomi-send');

            if (toggleBtn) {
                toggleBtn.onclick = () => this.toggle();
            }

            if (closeBtn) {
                closeBtn.onclick = () => this.toggle();
            }

            if (input && sendBtn) {
                const handleSend = () => {
                    const text = input.value;
                    if (text.trim()) {
                        this.sendMessage(text);
                        input.value = '';
                    }
                };

                sendBtn.onclick = handleSend;
                input.onkeydown = (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                };

                if (this.isOpen) {
                    setTimeout(() => input.focus(), 100);
                }
            }
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        adjustColor(color, amount) {
            const num = parseInt(color.replace('#', ''), 16);
            const r = Math.max(0, Math.min(255, (num >> 16) + amount));
            const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
            const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
            return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
        }
    }

    window.WataOmiWidgetCore = WataOmiWidgetCore;
})();
