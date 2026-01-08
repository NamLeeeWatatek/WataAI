import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';

import { SessionRepository } from './infrastructure/persistence/session.repository';
import { Session } from './domain/session';
import { User } from '../users/domain/user';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_EXPIRY_DAYS = 30;

  constructor(private readonly sessionRepository: SessionRepository) {}

  async findById(id: Session['id']): Promise<NullableType<Session>> {
    const session = await this.sessionRepository.findById(id);
    
    if (session) {
      // ✅ FIX: Check session expiry
      const expiryDate = new Date(session.createdAt);
      expiryDate.setDate(expiryDate.getDate() + this.SESSION_EXPIRY_DAYS);
      
      if (new Date() > expiryDate) {
        this.logger.log(`Session ${id} has expired, deleting...`);
        await this.deleteById(id);
        return null;
      }
    }
    
    return session;
  }

  create(
    data: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<Session> {
    return this.sessionRepository.create(data);
  }

  update(
    id: Session['id'],
    payload: Partial<
      Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Session | null> {
    return this.sessionRepository.update(id, payload);
  }

  deleteById(id: Session['id']): Promise<void> {
    return this.sessionRepository.deleteById(id);
  }

  deleteByUserId(conditions: { userId: User['id'] }): Promise<void> {
    return this.sessionRepository.deleteByUserId(conditions);
  }

  deleteByUserIdWithExclude(conditions: {
    userId: User['id'];
    excludeSessionId: Session['id'];
  }): Promise<void> {
    return this.sessionRepository.deleteByUserIdWithExclude(conditions);
  }
}
