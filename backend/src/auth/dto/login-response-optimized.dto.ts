import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Optimized login response - only essential data
 * Workspace list can be fetched separately via /workspaces endpoint
 */
export class LoginResponseOptimizedDto {
  @ApiProperty({ description: 'JWT access token' })
  token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration timestamp' })
  tokenExpires: number;

  @ApiProperty({ description: 'User basic info' })
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: 'admin' | 'user';
  };

  @ApiPropertyOptional({ description: "User's default workspace ID" })
  defaultWorkspaceId?: string;
}
