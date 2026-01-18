/**
 * Helper functions for workspace member role mapping
 * Maps between workspace role strings ('owner' | 'admin' | 'member') and role IDs
 */

// Workspace member role IDs (these should match the role table)
export const WORKSPACE_ROLE_IDS = {
  owner: 4,
  admin: 6, // Map to Manager/Editor role for workspace admins
  member: 3,
  viewer: 5,
} as const;

import { WorkspaceRole } from '../enums/workspace-role.enum';

/**
 * Get role ID from workspace role string
 */
export function getWorkspaceRoleId(role: WorkspaceRole): number {
  return WORKSPACE_ROLE_IDS[role];
}

/**
 * Get workspace role string from role entity name or ID
 */
export function getWorkspaceRoleFromEntity(
  roleEntity: { id?: number; name?: string } | null | undefined,
): WorkspaceRole | null {
  if (!roleEntity) return null;

  // Check by ID first
  if (roleEntity.id) {
    if (roleEntity.id === WORKSPACE_ROLE_IDS[WorkspaceRole.OWNER])
      return WorkspaceRole.OWNER;
    if (roleEntity.id === WORKSPACE_ROLE_IDS[WorkspaceRole.ADMIN])
      return WorkspaceRole.ADMIN;
    if (roleEntity.id === WORKSPACE_ROLE_IDS[WorkspaceRole.MEMBER])
      return WorkspaceRole.MEMBER;
    if (roleEntity.id === WORKSPACE_ROLE_IDS[WorkspaceRole.VIEWER])
      return WorkspaceRole.VIEWER;
  }

  // Check by name as fallback
  const name = roleEntity.name?.toLowerCase();
  if (name === WorkspaceRole.OWNER) return WorkspaceRole.OWNER;
  if (name === WorkspaceRole.ADMIN) return WorkspaceRole.ADMIN;
  if (name === WorkspaceRole.MEMBER) return WorkspaceRole.MEMBER;
  if (name === WorkspaceRole.VIEWER) return WorkspaceRole.VIEWER;

  return null;
}
