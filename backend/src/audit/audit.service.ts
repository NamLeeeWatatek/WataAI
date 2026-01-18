import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import {
  AuditLogEntity,
  DataAccessLogEntity,
} from './infrastructure/persistence/relational/entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private auditLogRepo: Repository<AuditLogEntity>,
    @InjectRepository(DataAccessLogEntity)
    private dataAccessLogRepo: Repository<DataAccessLogEntity>,
  ) {}

  async log(data: {
    userId: string;
    workspaceId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const log = this.auditLogRepo.create(data);
    return this.auditLogRepo.save(log);
  }

  async getAuditLogs(options: {
    workspaceId: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const query = this.auditLogRepo
      .createQueryBuilder('log')
      .where('log.workspaceId = :workspaceId', {
        workspaceId: options.workspaceId,
      });

    if (options.userId) {
      query.andWhere('log.userId = :userId', { userId: options.userId });
    }
    if (options.action) {
      query.andWhere('log.action = :action', { action: options.action });
    }
    if (options.resourceType) {
      query.andWhere('log.resourceType = :resourceType', {
        resourceType: options.resourceType,
      });
    }
    if (options.startDate) {
      query.andWhere('log.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }
    if (options.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: options.endDate });
    }

    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 50, 100);

    query
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async logDataAccess(data: {
    userId: string;
    workspaceId: string;
    tableName: string;
    recordId: string;
    action: 'read' | 'write' | 'delete';
  }) {
    const log = this.dataAccessLogRepo.create(data);
    return this.dataAccessLogRepo.save(log);
  }

  async getDataAccessLogs(options: {
    workspaceId: string;
    userId?: string;
    tableName?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const query = this.dataAccessLogRepo
      .createQueryBuilder('log')
      .where('log.workspaceId = :workspaceId', {
        workspaceId: options.workspaceId,
      });

    if (options.userId) {
      query.andWhere('log.userId = :userId', { userId: options.userId });
    }
    if (options.tableName) {
      query.andWhere('log.tableName = :tableName', {
        tableName: options.tableName,
      });
    }
    if (options.action) {
      query.andWhere('log.action = :action', { action: options.action });
    }
    if (options.startDate) {
      query.andWhere('log.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }
    if (options.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: options.endDate });
    }

    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 50, 100);

    query
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async cleanupOldLogs(daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const [auditResult, dataAccessResult] = await Promise.all([
      this.auditLogRepo.delete({ createdAt: LessThan(cutoffDate) }),
      this.dataAccessLogRepo.delete({ createdAt: LessThan(cutoffDate) }),
    ]);

    return {
      auditLogsDeleted: auditResult.affected ?? 0,
      dataAccessLogsDeleted: dataAccessResult.affected ?? 0,
    };
  }
}
