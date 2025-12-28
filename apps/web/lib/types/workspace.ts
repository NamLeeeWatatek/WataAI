
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
  avatarUrl?: string | null;
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';
}

export interface UpdateWorkspaceDto {
  name?: string;
  slug?: string;
  avatarUrl?: string | null;
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';
}

