// This config is used ONLY as a LAST RESORT fallback for Knowledge Base operations
// when no user-configured or workspace-configured AI provider is found.
// The system ALWAYS prioritizes:
// 1. Bot-specific AI settings
// 2. Knowledge Base specific AI settings
// 3. Workspace default AI settings
// 4. User default AI settings
// 5. This fallback config

export const KbAiConfig = {
    defaults: {
        model: 'gemini-2.0-flash', // Fallback model if everything else fails
    },
};
