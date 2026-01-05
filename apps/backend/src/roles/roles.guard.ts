import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<(number | string)[]>(
      'roles',
      [context.getClass(), context.getHandler()],
    );

    if (!roles || !roles.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      return false;
    }

    // Strict Role Checking Strategy
    // 1. If User Role is an object with ID (Standard for Relational/TypeORM)
    if (typeof user.role === 'object' && user.role.id) {
      // Check if any allowed role matches the user's role ID
      const matchesId = roles.some(role => String(role) === String(user.role.id));
      if (matchesId) return true;

      // ALSO CHECK NAME (if name exists on role object)
      // This allows @Roles('admin') to work even if we only have ID match logic previously
      if ('name' in user.role) {
        const matchesName = roles.some(role => String(role) === String((user.role as { name: string }).name));
        if (matchesName) return true;
      }
    }

    // 2. If User Role is a direct string (e.g. 'admin') - Legacy/Simple Auth
    if (typeof user.role === 'string') {
      return roles.some(role => String(role) === user.role);
    }

    // Fallback: If we can't determine, deny access
    return false;
  }
}
