import {
  Body,
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesS3PresignedService } from './files.service';
import { FilesService } from '../../../files.service';
import { FileUploadDto } from './dto/file.dto';
import { S3PresignedFileResponseDto } from './dto/file-response.dto';

@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesS3PresignedController {
  constructor(
    private readonly filesService: FilesS3PresignedService,
    private readonly filesGeneralService: FilesService,
  ) {}

  @ApiCreatedResponse({
    type: S3PresignedFileResponseDto,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  async uploadFile(@Body() file: FileUploadDto) {
    return this.filesService.create(file);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    // First delete from MinIO storage
    await this.filesService.deleteFile(id);
    // Then delete from database
    await this.filesGeneralService.delete(id);
  }
}
