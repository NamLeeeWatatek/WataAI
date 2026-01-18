import { ApiProperty } from '@nestjs/swagger';

export class UserCapabilitiesDto {
  @ApiProperty()
  role: string;

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty({ type: 'object', additionalProperties: { type: 'boolean' } })
  can_create: Record<string, boolean>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'boolean' } })
  can_read: Record<string, boolean>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'boolean' } })
  can_update: Record<string, boolean>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'boolean' } })
  can_delete: Record<string, boolean>;

  @ApiProperty({
    type: 'object',
    properties: {
      flow: { type: 'boolean' },
    },
  })
  can_execute: {
    flow: boolean;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      user_management: { type: 'boolean' },
      flow_builder: { type: 'boolean' },
      template_editor: { type: 'boolean' },
      bot_manager: { type: 'boolean' },
      channel_manager: { type: 'boolean' },
      integration_manager: { type: 'boolean' },
      analytics_dashboard: { type: 'boolean' },
      settings_panel: { type: 'boolean' },
      metadata_editor: { type: 'boolean' },
      flow_viewer: { type: 'boolean' },
      template_viewer: { type: 'boolean' },
      bot_viewer: { type: 'boolean' },
      channel_viewer: { type: 'boolean' },
      analytics_viewer: { type: 'boolean' },
    },
  })
  widgets: {
    user_management: boolean;
    flow_builder: boolean;
    template_editor: boolean;
    bot_manager: boolean;
    channel_manager: boolean;
    integration_manager: boolean;
    analytics_dashboard: boolean;
    settings_panel: boolean;
    metadata_editor: boolean;
    flow_viewer: boolean;
    template_viewer: boolean;
    bot_viewer: boolean;
    channel_viewer: boolean;
    analytics_viewer: boolean;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      can_export_analytics: { type: 'boolean' },
      can_manage_users: { type: 'boolean' },
      can_delete_flows: { type: 'boolean' },
      can_delete_templates: { type: 'boolean' },
      can_delete_bots: { type: 'boolean' },
      can_manage_integrations: { type: 'boolean' },
      can_update_settings: { type: 'boolean' },
      is_admin: { type: 'boolean' },
      is_super_admin: { type: 'boolean' },
    },
  })
  features: {
    can_export_analytics: boolean;
    can_manage_users: boolean;
    can_delete_flows: boolean;
    can_delete_templates: boolean;
    can_delete_bots: boolean;
    can_manage_integrations: boolean;
    can_update_settings: boolean;
    is_admin: boolean;
    is_super_admin: boolean;
  };
}
