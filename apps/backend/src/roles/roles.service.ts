import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { RoleEntity } from './infrastructure/persistence/relational/entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionEntity } from '../permissions/infrastructure/persistence/relational/entities/permission.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
    });

    if (createRoleDto.permissionIds) {
      role.permissions = await this.permissionRepository.findBy({
        id: In(createRoleDto.permissionIds),
      });
    }

    return this.roleRepository.save(role);
  }

  findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }

    return this.roleRepository.find({
      where,
      relations: ['permissions'],
      order: {
        id: 'ASC',
      },
    });
  }

  findOne(id: number) {
    return this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);
    if (!role) {
      throw new Error('Role not found');
    }

    if (updateRoleDto.name) {
      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.description) {
      role.description = updateRoleDto.description;
    }

    if (updateRoleDto.permissionIds) {
      const permissions = await this.permissionRepository.findBy({
        id: In(updateRoleDto.permissionIds),
      });
      role.permissions = permissions;
    }

    return this.roleRepository.save(role);
  }

  async remove(id: number) {
    await this.roleRepository.delete(id);
  }
}
