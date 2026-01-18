import { DefaultSession } from "next-auth"

export interface WorkspaceEntity {
    id: string
    name: string
    slug: string
    plan?: string
    avatarUrl?: string | null
    image?: string | null
    role?: string
}

export type UserRole = string | {
    id: number | string
    name?: string
}

declare module "next-auth" {
    interface Session {
        user: {
            role?: UserRole | null
            id: string
            avatarUrl?: string | null
            image?: string | null
        } & DefaultSession["user"]
        accessToken?: string
        refreshToken?: string
        error?: string
        workspace?: WorkspaceEntity | null
        workspaces?: WorkspaceEntity[]
    }

    interface User {
        role?: UserRole | null
        accessToken?: string
        refreshToken?: string
        avatarUrl?: string | null
        workspace?: WorkspaceEntity | null
        workspaces?: WorkspaceEntity[]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: UserRole | null
        accessToken?: string
        refreshToken?: string
        accessTokenExpires?: number
        error?: string
        workspace?: WorkspaceEntity | null
        workspaces?: WorkspaceEntity[]
        id?: string
        avatarUrl?: string | null
    }
}
