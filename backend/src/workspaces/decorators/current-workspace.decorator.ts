import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const isValidWorkspaceId = (id: any): id is string => {
  return (
    typeof id === 'string' &&
    id.trim() !== '' &&
    id !== 'undefined' &&
    id !== 'null'
  );
};

export const CurrentWorkspace = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();

    // 1. Check X-Workspace-Id header (recommended for frontend)
    const headerWorkspaceId = request.headers['x-workspace-id'];
    if (isValidWorkspaceId(headerWorkspaceId)) {
      return headerWorkspaceId;
    }

    // 2. Check query parameter (for API testing)
    const queryWorkspaceId = request.query?.workspaceId;
    if (isValidWorkspaceId(queryWorkspaceId)) {
      return queryWorkspaceId;
    }

    // 3. Check body (for POST/PATCH requests)
    const bodyWorkspaceId = request.body?.workspaceId;
    if (isValidWorkspaceId(bodyWorkspaceId)) {
      return bodyWorkspaceId;
    }

    // 4. Fallback to user's default workspace (set by middleware or from JWT)
    return request.defaultWorkspaceId || request.user?.workspaceId;
  },
);
