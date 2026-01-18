(function() {
    'use strict';

    const script = document.currentScript;
    const config = {
        botId: script.getAttribute('data-bot-id'),
        apiUrl: script.getAttribute('data-api-url') || 'http://localhost:8000/api/v1',
        position: script.getAttribute('data-position') || 'bottom-right',
        autoOpen: script.getAttribute('data-auto-open') === 'true',
        autoOpenDelay: parseInt(script.getAttribute('data-auto-open-delay') || '0'),
        version: typeof WIDGET_VERSION !== 'undefined' ? WIDGET_VERSION : null,
    };

    if (!config.botId) {
        return;
    }

    let widgetLoaded = false;
    let widgetCore = null;

    function createButton() {
        const button = document.createElement('div');
        button.id = 'wataomi-widget-button';
        button.style.cssText = `
            position: fixed;
            ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
            ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            transition: transform 0.2s, box-shadow 0.2s, opacity 0.3s;
            opacity: 0;
            pointer-events: none;
        `;
        
        button.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
        `;

        button.onmouseover = () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
        };
        button.onmouseout = () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        };

        button.onclick = loadWidget;
        document.body.appendChild(button);

        loadConfigAndShowButton(button);
    }

    async function loadConfigAndShowButton(button) {
        try {
            const configResponse = await fetch(`${config.apiUrl}/public/bots/${config.botId}/config`);
            if (!configResponse.ok) {
                throw new Error('Failed to fetch bot config');
            }
            const botConfig = await configResponse.json();
            
            config.version = botConfig.version;
            config.versionId = botConfig.versionId;
            config.botConfig = botConfig;

            const theme = botConfig.theme || {};
            const primaryColor = theme.primaryColor || '#667eea';
            const position = theme.position || config.position || 'bottom-right';
            const buttonSize = theme.buttonSize === 'large' ? '64px' : 
                              theme.buttonSize === 'small' ? '48px' : '56px';
            
            button.style.cssText = `
                position: fixed;
                ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                width: ${buttonSize};
                height: ${buttonSize};
                border-radius: 50%;
                background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                transition: transform 0.2s, box-shadow 0.2s, opacity 0.3s;
                opacity: 1;
                pointer-events: auto;
            `;

        } catch (error) {
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    }

    function adjustColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    async function loadWidget() {
        if (widgetLoaded) {
            if (widgetCore && widgetCore.toggle) {
                widgetCore.toggle();
            }
            return;
        }

        widgetLoaded = true;
        
        const button = document.getElementById('wataomi-widget-button');
        if (button) {
            button.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <circle cx="12" cy="12" r="10" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                    </path>
                </svg>
            `;
        }

        try {
            if (!config.botConfig) {
                const configResponse = await fetch(`${config.apiUrl}/public/bots/${config.botId}/config`);
                if (!configResponse.ok) {
                    throw new Error('Failed to fetch bot config');
                }
                const botConfig = await configResponse.json();
                
                config.version = botConfig.version;
                config.versionId = botConfig.versionId;
                config.botConfig = botConfig;
            }

            const coreScript = document.createElement('script');
            
            const baseUrl = script.src.substring(0, script.src.lastIndexOf('/'));
            coreScript.src = `${baseUrl}/v/${config.version}/core.js`;
            
            coreScript.onload = () => {
                if (window.WataOmiWidgetCore) {
                    widgetCore = new window.WataOmiWidgetCore(config);
                    widgetCore.init();
                    
                    if (button) {
                        button.remove();
                    }
                }
            };
            coreScript.onerror = () => {
                if (button) {
                    button.innerHTML = `
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    `;
                }
            };
            document.head.appendChild(coreScript);
        } catch (error) {
            if (button) {
                button.innerHTML = `
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                `;
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButton);
    } else {
        createButton();
    }

    if (config.autoOpen) {
        setTimeout(() => {
            loadWidget();
        }, config.autoOpenDelay * 1000);
    }

    window.WataOmiWidget = {
        open: loadWidget,
        config: config,
    };
})();
