import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { User } from './domain/user';
import bcrypt from 'bcryptjs';
import { Role } from '../roles/domain/role';
import { RoleEnum } from '../roles/roles.enum';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { FilesService } from '../files/files.service';

import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UserRepository,
    private readonly filesService: FilesService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const clonedPayload = {
      ...createUserDto,
    };

    if (clonedPayload.password) {
      const salt = await bcrypt.genSalt();
      clonedPayload.password = await bcrypt.hash(clonedPayload.password, salt);
    }

    // Role assignment refactor - Strict Enum Usage
    if (clonedPayload.role) {
      clonedPayload.role = this.transformRole(clonedPayload.role);
    } else {
      clonedPayload.role = {
        id: RoleEnum.user,
        name: 'user',
      } as Role;
    }

    const user = await this.usersRepository.create({
      ...clonedPayload,
      provider: clonedPayload.provider || 'email',
      isActive: clonedPayload.isActive ?? true,
      role: clonedPayload.role as Role,
      socialId: createUserDto.socialId,
    });

    await this.filesService.confirmFromUrl(user.avatarUrl);

    return user;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<[User[], number]> {
    return this.usersRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);
  }

  findByIds(ids: User['id'][]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    return this.usersRepository.findBySocialIdAndProvider({
      socialId,
      provider,
    });
  }

  async update(
    id: User['id'],
    updateUserDto: UpdateUserDto, // Strict typing
  ): Promise<User | null> {
    const currentUser = await this.usersRepository.findById(id);

    let password = updateUserDto.password;
    if (password) {
      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(password, salt);
    }

    let email = updateUserDto.email;

    if (updateUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );
      if (userObject && userObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailAlreadyExists',
          },
        });
      }
      email = updateUserDto.email;
    } else if (updateUserDto.email === null) {
      email = null;
    }

    let name = updateUserDto.name;
    // Legacy support for firstName/lastName if name is not provided
    if (
      name === undefined &&
      (updateUserDto.firstName !== undefined ||
        updateUserDto.lastName !== undefined)
    ) {
      const firstName = updateUserDto.firstName ?? currentUser?.firstName;
      const lastName = updateUserDto.lastName ?? currentUser?.lastName;
      name = [firstName, lastName].filter(Boolean).join(' ') || null;
    }

    // Role transformation
    const role =
      updateUserDto.role !== undefined
        ? this.transformRole(updateUserDto.role)
        : undefined;

    const payload: Partial<User> = {
      email,
      name,
      avatarUrl: updateUserDto.avatarUrl,
      password,
      provider: updateUserDto.provider,
      providerId: updateUserDto.providerId ?? updateUserDto.socialId,
      isActive: updateUserDto.isActive,
      role,
      roleId: updateUserDto.roleId,
      emailVerifiedAt: updateUserDto.emailVerifiedAt,
      socialId: updateUserDto.socialId,
    };

    // Remove undefined properties to avoid overwriting existing data with undefined
    // and triggering default fallbacks (like role defaulting to User) in Mapper
    Object.keys(payload).forEach((key) => {
      if (payload[key as keyof User] === undefined) {
        delete payload[key as keyof User];
      }
    });

    const updatedUser = await this.usersRepository.update(id, payload);

    if (updatedUser) {
      if (updatedUser.avatarUrl) {
        await this.filesService.confirmFromUrl(updatedUser.avatarUrl);
      }

      if (
        currentUser?.avatarUrl &&
        currentUser.avatarUrl !== updatedUser.avatarUrl
      ) {
        await this.filesService.deleteFromUrl(currentUser.avatarUrl);
      }
    }

    return updatedUser;
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.remove(id);
  }

  async verifyEmail(id: User['id']): Promise<User | null> {
    return this.usersRepository.update(id, {
      emailVerifiedAt: new Date(),
    });
  }

  async deactivate(id: User['id']): Promise<User | null> {
    return this.usersRepository.update(id, {
      isActive: false,
    });
  }

  async activate(id: User['id']): Promise<User | null> {
    return this.usersRepository.update(id, {
      isActive: true,
    });
  }

  // Private helper to isolate fragile role logic
  private transformRole(roleInput: string | Role | null): Role | null {
    if (roleInput === null) return null;
    if (typeof roleInput === 'string') {
      // If input is string key ("user"), map to Enum Value (2)
      const roleId = RoleEnum[roleInput as keyof typeof RoleEnum];
      if (roleId) {
        return {
          id: roleId,
          name: roleInput,
        } as Role;
      }
      // Fallback for safety, but this implies bad input
      return { id: RoleEnum.user, name: 'user' } as Role;
    }
    return roleInput as Role;
  }
}
