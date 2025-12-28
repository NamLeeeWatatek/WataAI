import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule
import { AuthModule } from './auth/auth.module';
import databaseConfig from './database/config/database.config';
import authConfig from './auth/config/auth.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import facebookConfig from './auth-facebook/config/facebook.config';
import googleConfig from './auth-google/config/google.config';

import appleConfig from './auth-apple/config/apple.config';
import queueConfig from './execution/config/queue.config';
import path from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAppleModule } from './auth-apple/auth-apple.module';
import { AuthFacebookModule } from './auth-facebook/auth-facebook.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';

import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import { MailModule } from './mail/mail.module';
import { HomeModule } from './home/home.module';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AllConfigType } from './config/config.type';
import { SessionModule } from './session/session.module';
import { MailerModule } from './mailer/mailer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './database/mongoose-config.service';
import { DatabaseConfig } from './database/config/database-config.type';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { AiProvidersModule } from './ai-providers/ai-providers.module';
import { BotsModule } from './bots/bots.module';
import { ConversationsModule } from './conversations/conversations.module';
import { ChannelsModule } from './channels/channels.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { StatsModule } from './stats/stats.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SharedModule } from './shared/shared.module';
import { TemplatesModule } from './templates/templates.module';
import { GenerationJobsModule } from './generation-jobs/generation-jobs.module';
import { CharactersModule } from './characters/characters.module';
import { RolesModule } from './roles/roles.module';
import { StylePresetsModule } from './style-presets/style-presets.module';
import { ExecutionModule } from './execution/execution.module';
import { ProjectsModule } from './projects/projects.module';
import { CreationToolsModule } from './creation-tools/creation-tools.module';

/**
 * Dynamically selects the database module based on configuration.
 * Uses MongoDB (Mongoose) for document database or SQL (TypeORM) for relational database.
 */
const infrastructureDatabaseModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? MongooseModule.forRootAsync({
    useClass: MongooseConfigService,
  })
  : TypeOrmModule.forRootAsync({
    useClass: TypeOrmConfigService,
    dataSourceFactory: async (options: DataSourceOptions) => {
      return new DataSource(options).initialize();
    },
  });

import { CategoriesModule } from './categories/categories.module';
import { CreationJobsModule } from './creation-jobs/creation-jobs.module';

@Module({
  imports: [
    CategoriesModule,
    CreationJobsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        facebookConfig,
        googleConfig,
        appleConfig,
        queueConfig,
      ],
      envFilePath: ['.env'],
    }),
    EventEmitterModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      ttl: 300,
    }),
    ScheduleModule.forRoot(), // Initialize ScheduleModule for Cron
    infrastructureDatabaseModule,
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('queue.host'),
          port: configService.get('queue.port'),
          password: configService.get('queue.password'),
          url: configService.get('queue.url'), // Support parsed URL if present
        },
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: {
          path: path.join(__dirname, 'i18n/'),
          watch: true,
        },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService<AllConfigType>) => {
            return [
              configService.get('app.headerLanguage', {
                infer: true,
              }),
            ];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),

    // Global shared services (encryption, etc.)
    SharedModule,

    UsersModule,
    FilesModule,
    WorkspacesModule,
    TemplatesModule,
    CreationToolsModule,
    AiProvidersModule,
    GenerationJobsModule,
    CharactersModule,
    StylePresetsModule,
    ProjectsModule,

    AuthModule,
    AuthFacebookModule,
    AuthGoogleModule,
    AuthAppleModule,

    SessionModule,

    MailModule,
    MailerModule,

    BotsModule,
    ConversationsModule,
    ChannelsModule,
    KnowledgeBaseModule,

    HomeModule,
    IntegrationsModule,
    StatsModule,

    WebhooksModule,
    SubscriptionsModule,
    AuditModule,
    NotificationsModule,

    PermissionsModule,
    RolesModule,
    ExecutionModule,
  ],
})
export class AppModule { }
