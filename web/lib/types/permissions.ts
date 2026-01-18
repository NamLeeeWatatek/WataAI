
export type Role =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'editor'
  | 'viewer'
  | 'viewer'
  | 'user'

export interface PermissionEntity {
  id: string
  name: string
  description?: string
  resource: string
  action: string
}

export interface RoleEntity {
  id: number
  name: string
  description?: string
  permissions: PermissionEntity[]
}

export type ResourceType =
  | 'user'
  | 'flow'
  | 'template'
  | 'bot'
  | 'channel'
  | 'integration'
  | 'settings'
  | 'analytics'
  | 'metadata'

export interface UserCapabilities {
  role: Role
  permissions: string[]
  can_create: Record<ResourceType, boolean>
  can_read: Record<ResourceType, boolean>
  can_update: Record<ResourceType, boolean>
  can_delete: Record<ResourceType, boolean>
  can_execute: {
    flow: boolean
  }
  widgets: {
    user_management: boolean
    flow_builder: boolean
    template_editor: boolean
    bot_manager: boolean
    channel_manager: boolean
    integration_manager: boolean
    analytics_dashboard: boolean
    settings_panel: boolean
    metadata_editor: boolean
    flow_viewer: boolean
    template_viewer: boolean
    bot_viewer: boolean
    channel_viewer: boolean
    analytics_viewer: boolean
  }
  features: {
    can_export_analytics: boolean
    can_manage_users: boolean
    can_delete_flows: boolean
    can_delete_templates: boolean
    can_delete_bots: boolean
    can_manage_integrations: boolean
    can_update_settings: boolean
    is_admin: boolean
    is_super_admin: boolean
  }
}

export interface PermissionCheckRequest {
  permissions: string[]
}

export interface PermissionCheckResponse {
  has_permission: boolean
  missing_permissions: string[]
}

export interface WidgetConfig {
  id: string
  name: string
  type: string
  visible: boolean
  enabled: boolean
  required_permissions: string[]
}

export interface RoleInfo {
  name: string
  display_name: string
  permissions: string[]
  permission_count: number
}

export interface ResourcePermissions {
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  can_list: boolean
}

export interface RoleBadgeProps {
  role?: Role
  className?: string
  variant?: 'default' | 'outline'
}

export interface PermissionGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode

  permission?: string
  permissions?: string[]
  requireAll?: boolean

  resource?: ResourceType
  action?: 'create' | 'read' | 'update' | 'delete'

  widget?: string

  feature?: string

  requireAdmin?: boolean
  requireSuperAdmin?: boolean

  showLoadingFallback?: boolean
}

export interface PermissionButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string

  permission?: string
  permissions?: string[]
  requireAll?: boolean

  resource?: ResourceType
  action?: 'create' | 'read' | 'update' | 'delete'

  hideIfNoPermission?: boolean
  disabledMessage?: string

  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
}

