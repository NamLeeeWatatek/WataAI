import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Public } from '../../utils/public.decorator';
import { WidgetVersionService } from '../services/widget-version.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Public Widget')
@Controller({ path: 'public/widget', version: '1' })
@Public()
export class PublicWidgetController {
  constructor(private readonly widgetVersionService: WidgetVersionService) {}

  @Get(':botId/loader.js')
  @Header('Content-Type', 'application/javascript')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({
    summary: 'Get widget loader script',
    description: 'Returns the widget loader JavaScript file',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  async getLoader(
    @Param('botId') botId: string,
    @Res() res: Response,
  ): Promise<void> {
    const activeVersion =
      await this.widgetVersionService.getActiveVersion(botId);

    if (!activeVersion) {
      throw new NotFoundException('No active widget version found');
    }

    const loaderPath = path.join(process.cwd(), 'public', 'widget-loader.js');

    if (!fs.existsSync(loaderPath)) {
      throw new NotFoundException(
        'Widget loader not found at: ' +
          loaderPath +
          '. Please copy widget files to apps/backend/public/',
      );
    }

    let loaderScript = fs.readFileSync(loaderPath, 'utf-8');

    loaderScript = loaderScript.replace(
      '',
      `const WIDGET_VERSION = '${activeVersion.version}';`,
    );

    res.send(loaderScript);
  }

  @Get(':botId/v/:version/core.js')
  @Header('Content-Type', 'application/javascript')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  @ApiOperation({
    summary: 'Get versioned widget core script',
    description:
      'Returns the widget core JavaScript file for a specific version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'version', type: 'string' })
  async getCore(
    @Param('botId') botId: string,
    @Param('version') version: string,
    @Res() res: Response,
  ): Promise<void> {
    const versions = await this.widgetVersionService.listVersions(
      botId,
      undefined,
    );

    const versionExists = versions.some((v) => v.version === version);
    if (!versionExists) {
      throw new NotFoundException('Widget version not found');
    }

    const corePath = path.join(process.cwd(), 'public', 'widget-core.js');

    if (!fs.existsSync(corePath)) {
      throw new NotFoundException(
        'Widget core not found at: ' +
          corePath +
          '. Please copy widget files to apps/backend/public/',
      );
    }

    const coreScript = fs.readFileSync(corePath, 'utf-8');
    res.send(coreScript);
  }

  @Get(':botId/v/:version/styles.css')
  @Header('Content-Type', 'text/css')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  @ApiOperation({
    summary: 'Get versioned widget styles',
    description: 'Returns the widget CSS file for a specific version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'version', type: 'string' })
  async getStyles(
    @Param('botId') botId: string,
    @Param('version') version: string,
    @Res() res: Response,
  ): Promise<void> {
    const stylesPath = path.join(process.cwd(), 'public', 'widget-styles.css');

    if (!fs.existsSync(stylesPath)) {
      res.send('');
      return;
    }

    const styles = fs.readFileSync(stylesPath, 'utf-8');
    res.send(styles);
  }
}
