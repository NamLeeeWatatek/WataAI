import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract workspaceId from request
 * Can be from params, query, or body
 */
export const WorkspaceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();

    if (request.params?.workspaceId) {
      return request.params.workspaceId;
    }

    if (request.query?.workspaceId) {
      return request.query.workspaceId;
    }

    if (request.body?.workspaceId) {
      return request.body.workspaceId;
    }

    return undefined;
  },
);
