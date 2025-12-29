import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from '../../../../permissions/infrastructure/persistence/relational/entities/permission.entity';

@Injectable()
export class PermissionSeedService {
  constructor(
    @InjectRepository(PermissionEntity)
    private repository: Repository<PermissionEntity>,
  ) {}

  async run() {
    const permissions = [
      // IAM (Identity & Access Management)
      {
        name: 'iam:Create',
        description: 'Create new users',
        resource: 'iam',
        action: 'Create',
      },
      {
        name: 'iam:Get',
        description: 'View user details',
        resource: 'iam',
        action: 'Get',
      },
      {
        name: 'iam:ListUsers',
        description: 'List all users',
        resource: 'iam',
        action: 'ListUsers',
      },
      {
        name: 'iam:Update',
        description: 'Update user details',
        resource: 'iam',
        action: 'Update',
      },
      {
        name: 'iam:Delete',
        description: 'Delete users',
        resource: 'iam',
        action: 'Delete',
      },
      {
        name: 'iam:CreateRole',
        description: 'Create new roles',
        resource: 'iam',
        action: 'CreateRole',
      },
      {
        name: 'iam:GetRole',
        description: 'View role details',
        resource: 'iam',
        action: 'GetRole',
      },
      {
        name: 'iam:ListRoles',
        description: 'List all roles',
        resource: 'iam',
        action: 'ListRoles',
      },
      {
        name: 'iam:UpdateRole',
        description: 'Update role permissions',
        resource: 'iam',
        action: 'UpdateRole',
      },
      {
        name: 'iam:DeleteRole',
        description: 'Delete roles',
        resource: 'iam',
        action: 'DeleteRole',
      },
      {
        name: 'iam:ListMembers',
        description: 'List workspace members',
        resource: 'iam',
        action: 'ListMembers',
      },
      {
        name: 'iam:AddMember',
        description: 'Add member to workspace',
        resource: 'iam',
        action: 'AddMember',
      },
      {
        name: 'iam:UpdateMember',
        description: 'Update member role',
        resource: 'iam',
        action: 'UpdateMember',
      },
      {
        name: 'iam:RemoveMember',
        description: 'Remove member from workspace',
        resource: 'iam',
        action: 'RemoveMember',
      },

      // Bots
      {
        name: 'bot:*',
        description: 'Full access to Bots',
        resource: 'bot',
        action: '*',
      },
      {
        name: 'bot:Create',
        description: 'Create new bots',
        resource: 'bot',
        action: 'Create',
      },
      {
        name: 'bot:Get',
        description: 'View bot details',
        resource: 'bot',
        action: 'Get',
      },
      {
        name: 'bot:List',
        description: 'List available bots',
        resource: 'bot',
        action: 'List',
      },
      {
        name: 'bot:Update',
        description: 'Configure bots',
        resource: 'bot',
        action: 'Update',
      },
      {
        name: 'bot:Delete',
        description: 'Delete bots',
        resource: 'bot',
        action: 'Delete',
      },
      {
        name: 'bot:Chat',
        description: 'Chat with bots',
        resource: 'bot',
        action: 'Chat',
      },

      // AI Providers
      {
        name: 'ai:*',
        description: 'Full access to AI Providers',
        resource: 'ai',
        action: '*',
      },
      {
        name: 'ai:Create',
        description: 'Connect AI provider',
        resource: 'ai',
        action: 'Create',
      },
      {
        name: 'ai:List',
        description: 'List AI providers',
        resource: 'ai',
        action: 'List',
      },
      {
        name: 'ai:Get',
        description: 'View AI provider config',
        resource: 'ai',
        action: 'Get',
      },
      {
        name: 'ai:Update',
        description: 'Update AI provider config',
        resource: 'ai',
        action: 'Update',
      },
      {
        name: 'ai:Delete',
        description: 'Delete AI provider config',
        resource: 'ai',
        action: 'Delete',
      },
      {
        name: 'ai:Usage',
        description: 'View AI usage',
        resource: 'ai',
        action: 'Usage',
      },

      // Flows
      {
        name: 'flow:*',
        description: 'Full access to Flows',
        resource: 'flow',
        action: '*',
      },
      {
        name: 'flow:Create',
        description: 'Create new flows',
        resource: 'flow',
        action: 'Create',
      },
      {
        name: 'flow:Get',
        description: 'View flow details',
        resource: 'flow',
        action: 'Get',
      },
      {
        name: 'flow:List',
        description: 'List flows',
        resource: 'flow',
        action: 'List',
      },
      {
        name: 'flow:Update',
        description: 'Edit flow logic',
        resource: 'flow',
        action: 'Update',
      },
      {
        name: 'flow:Delete',
        description: 'Delete flows',
        resource: 'flow',
        action: 'Delete',
      },
      {
        name: 'flow:Execute',
        description: 'Run flows',
        resource: 'flow',
        action: 'Execute',
      },

      // Tools
      {
        name: 'tool:*',
        description: 'Full access to Tools',
        resource: 'tool',
        action: '*',
      },
      {
        name: 'tool:Create',
        description: 'Create new tools',
        resource: 'tool',
        action: 'Create',
      },
      {
        name: 'tool:Get',
        description: 'View tool details',
        resource: 'tool',
        action: 'Get',
      },
      {
        name: 'tool:List',
        description: 'List creation tools',
        resource: 'tool',
        action: 'List',
      },
      {
        name: 'tool:Update',
        description: 'Edit tool configuration',
        resource: 'tool',
        action: 'Update',
      },
      {
        name: 'tool:Delete',
        description: 'Delete tools',
        resource: 'tool',
        action: 'Delete',
      },

      // Templates
      {
        name: 'template:*',
        description: 'Full access to Templates',
        resource: 'template',
        action: '*',
      },
      {
        name: 'template:Create',
        description: 'Create new templates',
        resource: 'template',
        action: 'Create',
      },
      {
        name: 'template:Get',
        description: 'View template details',
        resource: 'template',
        action: 'Get',
      },
      {
        name: 'template:List',
        description: 'List templates',
        resource: 'template',
        action: 'List',
      },
      {
        name: 'template:Update',
        description: 'Edit templates',
        resource: 'template',
        action: 'Update',
      },
      {
        name: 'template:Delete',
        description: 'Delete templates',
        resource: 'template',
        action: 'Delete',
      },

      // Knowledge Base
      {
        name: 'kb:*',
        description: 'Full access to Knowledge Base',
        resource: 'kb',
        action: '*',
      },
      {
        name: 'kb:Create',
        description: 'Create knowledge bases',
        resource: 'kb',
        action: 'Create',
      },
      {
        name: 'kb:Get',
        description: 'View knowledge base details',
        resource: 'kb',
        action: 'Get',
      },
      {
        name: 'kb:List',
        description: 'List knowledge bases',
        resource: 'kb',
        action: 'List',
      },
      {
        name: 'kb:Update',
        description: 'Update knowledge base',
        resource: 'kb',
        action: 'Update',
      },
      {
        name: 'kb:Delete',
        description: 'Delete knowledge base',
        resource: 'kb',
        action: 'Delete',
      },
      {
        name: 'kb:Sync',
        description: 'Sync knowledge base data',
        resource: 'kb',
        action: 'Sync',
      },
      {
        name: 'kb:Chat',
        description: 'Chat with knowledge base',
        resource: 'kb',
        action: 'Chat',
      },

      // Files
      {
        name: 'file:*',
        description: 'Full access to Files',
        resource: 'file',
        action: '*',
      },
      {
        name: 'file:Upload',
        description: 'Upload files',
        resource: 'file',
        action: 'Upload',
      },
      {
        name: 'file:List',
        description: 'List files',
        resource: 'file',
        action: 'List',
      },
      {
        name: 'file:Delete',
        description: 'Delete files',
        resource: 'file',
        action: 'Delete',
      },

      // Workspaces
      {
        name: 'workspace:*',
        description: 'Full access to Workspaces',
        resource: 'workspace',
        action: '*',
      },
      {
        name: 'workspace:Create',
        description: 'Create workspaces',
        resource: 'workspace',
        action: 'Create',
      },
      {
        name: 'workspace:Get',
        description: 'View workspace details',
        resource: 'workspace',
        action: 'Get',
      },
      {
        name: 'workspace:List',
        description: 'List workspaces',
        resource: 'workspace',
        action: 'List',
      },
      {
        name: 'workspace:Update',
        description: 'Update workspace settings',
        resource: 'workspace',
        action: 'Update',
      },
      {
        name: 'workspace:Delete',
        description: 'Delete workspaces',
        resource: 'workspace',
        action: 'Delete',
      },
      {
        name: 'workspace:Invite',
        description: 'Invite users to workspace',
        resource: 'workspace',
        action: 'Invite',
      },

      // Integrations
      {
        name: 'integration:*',
        description: 'Full access to Integrations',
        resource: 'integration',
        action: '*',
      },
      {
        name: 'integration:Create',
        description: 'Connect new integrations',
        resource: 'integration',
        action: 'Create',
      },
      {
        name: 'integration:List',
        description: 'View integrations',
        resource: 'integration',
        action: 'List',
      },
      {
        name: 'integration:Update',
        description: 'Update integration settings',
        resource: 'integration',
        action: 'Update',
      },
      {
        name: 'integration:Delete',
        description: 'Disconnect integrations',
        resource: 'integration',
        action: 'Delete',
      },

      // Channels
      {
        name: 'channel:*',
        description: 'Full access to Channels',
        resource: 'channel',
        action: '*',
      },
      {
        name: 'channel:Create',
        description: 'Create channels',
        resource: 'channel',
        action: 'Create',
      },
      {
        name: 'channel:List',
        description: 'List channels',
        resource: 'channel',
        action: 'List',
      },
      {
        name: 'channel:Update',
        description: 'Update channel',
        resource: 'channel',
        action: 'Update',
      },
      {
        name: 'channel:Delete',
        description: 'Delete channel',
        resource: 'channel',
        action: 'Delete',
      },

      // System
      {
        name: 'system:*',
        description: 'Full access to System Settings',
        resource: 'system',
        action: '*',
      },
      {
        name: 'system:ReadSettings',
        description: 'View system settings',
        resource: 'system',
        action: 'ReadSettings',
      },
      {
        name: 'system:UpdateSettings',
        description: 'Update system settings',
        resource: 'system',
        action: 'UpdateSettings',
      },
      {
        name: 'system:ReadAuditLogs',
        description: 'View audit logs',
        resource: 'system',
        action: 'ReadAuditLogs',
      },

      // Jobs (New)
      {
        name: 'job:*',
        description: 'Full access to Jobs',
        resource: 'job',
        action: '*',
      },
      {
        name: 'job:Create',
        description: 'Create new jobs',
        resource: 'job',
        action: 'Create',
      },
      {
        name: 'job:List',
        description: 'List jobs',
        resource: 'job',
        action: 'List',
      },
      {
        name: 'job:Get',
        description: 'View job details',
        resource: 'job',
        action: 'Get',
      },
      {
        name: 'job:Update',
        description: 'Update jobs',
        resource: 'job',
        action: 'Update',
      },
      {
        name: 'job:Delete',
        description: 'Delete jobs',
        resource: 'job',
        action: 'Delete',
      },

      // Conversations
      {
        name: 'conversation:*',
        description: 'Full access to Conversations',
        resource: 'conversation',
        action: '*',
      },
      {
        name: 'conversation:Create',
        description: 'Create new coversations',
        resource: 'conversation',
        action: 'Create',
      },
      {
        name: 'conversation:List',
        description: 'List conversations',
        resource: 'conversation',
        action: 'List',
      },
      {
        name: 'conversation:Get',
        description: 'View conversation details',
        resource: 'conversation',
        action: 'Get',
      },
      {
        name: 'conversation:Update',
        description: 'Update conversation status',
        resource: 'conversation',
        action: 'Update',
      },
      {
        name: 'conversation:Delete',
        description: 'Delete conversations',
        resource: 'conversation',
        action: 'Delete',
      },
    ];

    for (const permission of permissions) {
      const exists = await this.repository.findOne({
        where: { name: permission.name },
      });

      if (!exists) {
        await this.repository.save(this.repository.create(permission));
      } else {
        // Update description if it changed (optional, but good for seeds)
        exists.description = permission.description;
        exists.resource = permission.resource;
        exists.action = permission.action;
        await this.repository.save(exists);
      }
    }
  }
}
