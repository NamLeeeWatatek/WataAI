import { RoleEntity } from './permissions';

export enum RoleEnum {
    ADMIN = 'admin',
    USER = 'user',
    OWNER = 'owner',
    MEMBER = 'member',
}

export interface User {
    id: string;
    email: string | null;
    name: string | null;
    firstName?: string;
    lastName?: string;
    role: RoleEntity | null;
    roleId?: number;
    isActive: boolean;
    provider: string;
    providerId?: string | null;
    emailVerifiedAt?: string | null;
    status: {
        id: number;
        name: string;
    };
    photo?: {
        id: string;
        path: string;
    };
    avatarUrl?: string | null;
    workspaceId?: string;
    lastLogin?: string | null;
    createdAt: string;
    updatedAt: string;
    permissions?: Record<string, any>;
    notificationPreferences?: {
        desktop?: boolean;
        sound?: boolean;
        messagePreview?: boolean;
        onlyWhenInactive?: boolean;
        doNotDisturb?: boolean;
        mutedConversations?: string[];
        [key: string]: any;
    };
}

export interface CreateUserDto {
    email: string | null;
    name?: string | null;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    status?: {
        id: number;
    };
    roleId?: number;
    avatarUrl?: string | null;
    isActive?: boolean;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
    id?: string;
    notificationPreferences?: Record<string, any>;
}
