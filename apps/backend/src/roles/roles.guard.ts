import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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

    if (!user) {
      return false;
    }

    const userRole = user.role;

    // 1. Nếu userRole là string (trường hợp simple)
    if (typeof userRole === 'string') {
      return roles.map(String).includes(userRole);
    }

    // 2. Nếu userRole là object có ID
    if (userRole?.id !== undefined) {
      // 2a. Nếu decorator truyền vào là ID (number/string ID) -> so sánh ID
      const hasIdMatch = roles.map(String).includes(String(userRole.id));
      if (hasIdMatch) return true;

      // 2b. Nếu decorator truyền vào là Name ('admin') -> so sánh Name
      if (userRole.name) {
        const hasNameMatch = roles
          .map((r) => String(r).toLowerCase())
          .includes(userRole.name.toLowerCase());
        if (hasNameMatch) return true;
      }
      // 2c. Fallback: Map từ Name trong decorator ('admin') sang ID trong RoleEnum (1) để so sánh vói userRole.id
      const hasMappedIdMatch = roles.some((role) => {
        if (typeof role === 'string') {
          // Access enum by key string (e.g. RoleEnum['admin'])
          const enumId = (RoleEnum as any)[role.toLowerCase()];
          if (enumId) {
            return String(enumId) === String(userRole.id);
          }
        }
        return false;
      });

      if (hasMappedIdMatch) return true;
    }

    return false;
  }
}
