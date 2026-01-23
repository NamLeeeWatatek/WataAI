import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';
import { HttpExceptionFilter } from './utils/filters/http-exception.filter';

import { Request, Response, NextFunction } from 'express';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    cors: false,
  });

  const configService = app.get(ConfigService<AllConfigType>);

  app.enableCors({
    origin: configService.getOrThrow('app.frontendDomain', { infer: true }),
    credentials: true,
  });

  const apiPrefix = configService.getOrThrow('app.apiPrefix', { infer: true });

  app.use(
    `/${apiPrefix}/v1/webhooks`,
    bodyParser.json({
      verify: (req: RequestWithRawBody, res: Response, buf: Buffer) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(bodyParser.json({ limit: '500mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Frame-Options');
    next();
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableShutdownHooks();
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
