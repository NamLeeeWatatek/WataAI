import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator - há»— trá»£ cáº£ string vÃ  number roles
 * @param roles - 'admin' | 'user' hoáº·c RoleEnum values
 */
export const Roles = (...roles: (string | number)[]) =>
  SetMetadata('roles', roles);
