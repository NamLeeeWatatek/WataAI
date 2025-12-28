export const PERMISSIONS = {
    // IAM
    IAM: {
        CREATE_USER: 'iam:Create',
        READ_USER: 'iam:Get',
        LIST_USERS: 'iam:ListUsers',
        UPDATE_USER: 'iam:Update',
        DELETE_USER: 'iam:Delete',

        CREATE_ROLE: 'iam:CreateRole',
        READ_ROLE: 'iam:GetRole',
        LIST_ROLES: 'iam:ListRoles',
        UPDATE_ROLE: 'iam:UpdateRole',
        DELETE_ROLE: 'iam:DeleteRole',
    },

    // SYSTEM
    SYSTEM: {
        FULL_ACCESS: 'system:*',
        READ_SETTINGS: 'system:ReadSettings',
        UPDATE_SETTINGS: 'system:UpdateSettings',
        READ_LOGS: 'system:ReadAuditLogs',
    },

    // WORKSPACES
    WORKSPACES: {
        FULL_ACCESS: 'workspace:*',
        CREATE: 'workspace:Create',
        READ: 'workspace:Get',
        LIST: 'workspace:List',
        UPDATE: 'workspace:Update',
        DELETE: 'workspace:Delete',
        INVITE: 'workspace:Invite',
    },

    // TOOLS (Creation Tools)
    TOOLS: {
        FULL_ACCESS: 'tool:*',
        CREATE: 'tool:Create',
        READ: 'tool:Get',
        LIST: 'tool:List',
        UPDATE: 'tool:Update',
        DELETE: 'tool:Delete',
    },

    // TEMPLATES
    TEMPLATES: {
        FULL_ACCESS: 'template:*',
        CREATE: 'template:Create',
        READ: 'template:Get',
        LIST: 'template:List',
        UPDATE: 'template:Update',
        DELETE: 'template:Delete',
    },

    // BOTS
    BOTS: {
        FULL_ACCESS: 'bot:*',
        CREATE: 'bot:Create',
        READ: 'bot:Get',
        LIST: 'bot:List',
        UPDATE: 'bot:Update',
        DELETE: 'bot:Delete',
        CHAT: 'bot:Chat',
    },

    // CHANNELS
    CHANNELS: {
        FULL_ACCESS: 'channel:*',
        CREATE: 'channel:Create',
        LIST: 'channel:List',
        UPDATE: 'channel:Update',
        DELETE: 'channel:Delete',
    },

    // INTEGRATIONS
    INTEGRATIONS: {
        FULL_ACCESS: 'integration:*',
        CREATE: 'integration:Create',
        LIST: 'integration:List',
        UPDATE: 'integration:Update',
        DELETE: 'integration:Delete',
    },
} as const;

export type PermissionString =
    | typeof PERMISSIONS.IAM[keyof typeof PERMISSIONS.IAM]
    | typeof PERMISSIONS.SYSTEM[keyof typeof PERMISSIONS.SYSTEM]
    | typeof PERMISSIONS.TOOLS[keyof typeof PERMISSIONS.TOOLS]
    | typeof PERMISSIONS.TEMPLATES[keyof typeof PERMISSIONS.TEMPLATES]
    | string;
