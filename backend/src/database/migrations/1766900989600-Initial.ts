import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1766900989600 implements MigrationInterface {
  name = 'Initial1766900989600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "permission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "resource" character varying NOT NULL, "action" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_240853a0c3353c25fb12434ad33" UNIQUE ("name"), CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role" ("id" integer NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "name" character varying, "avatar_url" character varying, "password_hash" character varying, "provider" character varying NOT NULL DEFAULT 'email', "provider_id" character varying, "email_verified_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "first_name" character varying, "last_name" character varying, "social_id" character varying, "external_id" character varying, "last_login" TIMESTAMP, "failed_login_attempts" integer NOT NULL DEFAULT '0', "locked_until" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "role_id" integer, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_d9479cbc9c65660b7cf9b657954" UNIQUE ("external_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e3a2b86fd9a9c22c266ae0473" ON "user" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a4fd2a547828e5efe420e50d1" ON "user" ("first_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6937e802be2946855a3ad0e6be" ON "user" ("last_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0cd76a8cdee62eeff31d384b73" ON "user" ("social_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "avatar_url" character varying, "owner_id" uuid NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0d706c438a9b1ae0ac9806a201a" UNIQUE ("slug"), CONSTRAINT "PK_ca86b6f9b3be5fe26d307d09b49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d706c438a9b1ae0ac9806a201" ON "workspace" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_member" ("workspace_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role_id" integer NOT NULL DEFAULT '3', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0eab76d5a9c509930a9f3d7a104" PRIMARY KEY ("workspace_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0eab76d5a9c509930a9f3d7a10" ON "workspace_member" ("workspace_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_providers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "label" character varying NOT NULL, "icon" character varying, "description" text, "required_fields" jsonb NOT NULL DEFAULT '[]', "optional_fields" jsonb NOT NULL DEFAULT '[]', "default_values" jsonb NOT NULL DEFAULT '{}', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ebb21740e10748770b54434db59" UNIQUE ("key"), CONSTRAINT "PK_de28ebefc0fb425c37b27a4c0a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_provider_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider_id" uuid NOT NULL, "model" character varying NOT NULL, "api_key" character varying NOT NULL, "base_url" character varying, "api_version" character varying, "timeout" integer, "use_stream" boolean NOT NULL DEFAULT true, "owner_type" character varying NOT NULL, "owner_id" uuid, "is_default" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c72661bb93d1e6263172f452db" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7299ed156a084d7e97df80b7ff" ON "ai_provider_configs" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2bdd8f45e064bac6f99cbbe91d" ON "ai_provider_configs" ("owner_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4e4ef106d84e38e8577cd965d" ON "ai_provider_configs" ("owner_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_ai_provider_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider_id" uuid NOT NULL, "display_name" character varying NOT NULL, "config" jsonb NOT NULL, "model_list" jsonb NOT NULL DEFAULT '[]', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b5931888df2b024311f8a132373" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bca82934cd53e143c74a2ff97c" ON "user_ai_provider_configs" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec0f1703bed5fb29ea5e0afe16" ON "user_ai_provider_configs" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_ai_provider_configs" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider_id" uuid NOT NULL, "display_name" character varying NOT NULL, "config" jsonb NOT NULL, "model_list" jsonb NOT NULL DEFAULT '[]', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_453a175908363f730ee3ad12c4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3522a3e473b56a703fe8d98c95" ON "workspace_ai_provider_configs" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d05834339513f9800bc9a6915" ON "workspace_ai_provider_configs" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a9a6100cbec33ef94cd06e46fe" ON "workspace_ai_provider_configs" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a55b8ba19368d0e6499ba5df1" ON "workspace_ai_provider_configs" ("provider_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_usage_log" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" character varying NOT NULL, "model" character varying NOT NULL, "input_tokens" integer NOT NULL, "output_tokens" integer NOT NULL, "cost" numeric(10,6) NOT NULL DEFAULT '0', "requested_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b51c8fcf98a77ad8bef55c91bd5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d4b3d0a0eac463e2224513fff7" ON "ai_usage_log" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5f07b3eb775938e5d5dfc5843b" ON "ai_usage_log" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_581a0ff70741335110a92e8a18" ON "ai_usage_log" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d7b00762ea27339b5f6ea53bfa" ON "ai_usage_log" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_18f3bc73d7d2692f732cc974f0" ON "ai_usage_log" ("requested_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "system_ai_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "default_provider_id" character varying, "default_model" character varying, "min_temperature" numeric(3,1) NOT NULL DEFAULT '0', "max_temperature" numeric(3,1) NOT NULL DEFAULT '2', "content_moderation" boolean NOT NULL DEFAULT true, "safe_fallbacks" boolean NOT NULL DEFAULT true, "context_aware" boolean NOT NULL DEFAULT true, "max_requests_per_hour" integer NOT NULL DEFAULT '1000', "max_requests_per_user" integer NOT NULL DEFAULT '100', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4ea8c546ef61546cb93977c6d9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_invitation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "workspace_id" uuid NOT NULL, "role_id" integer NOT NULL, "sender_id" uuid NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "accepted_at" TIMESTAMP, CONSTRAINT "UQ_49e1b235ed0b102d72b8f299d6a" UNIQUE ("token"), CONSTRAINT "PK_8d58734b72dc04a88ff86fab9dc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_353a007588fb0ce02e603f1a67" ON "workspace_invitation" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_49e1b235ed0b102d72b8f299d6" ON "workspace_invitation" ("token") `,
    );
    await queryRunner.query(
      `CREATE TABLE "webhook_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channel_id" uuid NOT NULL, "raw_payload" jsonb NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "error_message" text, "processed_at" TIMESTAMP, "received_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0f56d2f40f5ec823acf8e8edad1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0253cc148d22e4ba68ca3ededf" ON "webhook_event" ("channel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63a1ffd56c6903021d2c5b6aaa" ON "webhook_event" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c9c20a97f6b381386a315f74c3" ON "webhook_event" ("received_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" character varying, "icon" character varying, "type" character varying NOT NULL DEFAULT 'system', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_85857c8a275edcd68dc6c7a1a0e" UNIQUE ("slug", "type"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_23c05c292c439d77b0de816b50" ON "category" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb73208f151aa71cdd78f662d7" ON "category" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63ad76a14a8321d22dc0a5e704" ON "category" ("type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "creation_tool" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "icon" character varying, "cover_image" character varying, "form_config" jsonb NOT NULL, "execution_flow" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "workspace_id" uuid, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "category_id" uuid, CONSTRAINT "UQ_712006d033481a0b3e433132769" UNIQUE ("slug"), CONSTRAINT "PK_9f58e7f23046a18e8e157150149" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_39f0a0ce96e591d2aff915fb32" ON "creation_tool" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_712006d033481a0b3e43313276" ON "creation_tool" ("slug") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a0e54dd330805ccb6486814ef" ON "creation_tool" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd6e013d98ac33e10aea9137cc" ON "creation_tool" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "creation_tool_id" uuid, "name" character varying NOT NULL, "description" character varying, "prompt" text, "media_files" jsonb, "style_config" jsonb, "prefilled_data" jsonb, "thumbnail_url" character varying, "execution_overrides" jsonb, "is_active" boolean NOT NULL DEFAULT true, "created_by" uuid, "workspace_id" uuid, "sort_order" integer NOT NULL DEFAULT '0', "prompt_template" text, "execution_config" jsonb, "form_schema" jsonb, "input_schema" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "category_id" uuid, CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9b6a7e06a23a072d065e6790dc" ON "template" ("creation_tool_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a62147c0d6b868e797061e142a" ON "template" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_941289df174d4ece7998279a6c" ON "template" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f8b9d372187ad54c33210721d" ON "template" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "plan" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "price_monthly" numeric(10,2) NOT NULL, "price_yearly" numeric(10,2) NOT NULL, "max_bots" integer NOT NULL, "max_messages" integer NOT NULL, "max_storage_gb" integer NOT NULL, "features" jsonb, CONSTRAINT "UQ_8aa73af67fa634d33de9bf874ab" UNIQUE ("name"), CONSTRAINT "PK_54a2b686aed3b637654bf7ddbb3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "plan_id" uuid NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "current_period_end" TIMESTAMP NOT NULL, "stripe_customer_id" character varying, "stripe_subscription_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6026acc5aa817269a5f7463526" ON "subscription" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5fde988e5d9b9a522d70ebec27" ON "subscription" ("plan_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c60cbdbd21c49a01596ec24d1f" ON "subscription" ("stripe_customer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4919f4488c35799176dfd3c143" ON "subscription" ("stripe_subscription_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "usage_quota" ("workspace_id" uuid NOT NULL, "period_start" date NOT NULL, "messages_used" integer NOT NULL DEFAULT '0', "storage_used_gb" numeric(10,2) NOT NULL DEFAULT '0', "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_192fa04382405c62d6e7a0eedf0" PRIMARY KEY ("workspace_id", "period_start"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_192fa04382405c62d6e7a0eedf" ON "usage_quota" ("workspace_id", "period_start") `,
    );
    await queryRunner.query(
      `CREATE TABLE "invoice" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "subscription_id" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'draft', "pdf_url" character varying, "period_start" date NOT NULL, "period_end" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a85d07a63679df4dd094bfc756" ON "invoice" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d9508325a862b5b3c7c819de3" ON "invoice" ("subscription_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "style_preset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "config" jsonb NOT NULL, "workspace_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_16395360d5d5e38e971b4045841" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f79152848380534cf3a31add03" ON "style_preset" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c77899995a4a2887a85d722279" ON "style_preset" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "status" ("id" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_e12743a7086ec826733f54e1d95" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "workspace_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dedfea394088ed136ddadeee89" ON "project" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5cb157e3d3ab8abd16251129db" ON "project" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "workspace_id" uuid NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "type" character varying NOT NULL DEFAULT 'info', "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_928b7aa1754e08e1ed7052cb9d" ON "notification" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f7d684c30d9d0cdbc24322de8" ON "notification" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aedc307c7e60ecb138e3f90ff8" ON "notification" ("is_read") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8bdc07e9c41ce8d83730f0f5d8" ON "notification" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "knowledge_base" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "ai_provider_id" uuid, "rag_model" character varying, "embedding_model" character varying NOT NULL DEFAULT 'text-embedding-3-small', "chunk_size" integer NOT NULL DEFAULT '1000', "chunk_overlap" integer NOT NULL DEFAULT '200', "total_documents" integer NOT NULL DEFAULT '0', "total_size" bigint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "deleted_at" TIMESTAMP, CONSTRAINT "PK_19d3f52f6da1501b7e235f1da5c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f39683bc3c87e158ee5afffdba" ON "knowledge_base" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a47b1575e8f2c2cc377a9cc40f" ON "knowledge_base" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_494eaf1b1f45f0ffd71bef6a1b" ON "knowledge_base" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ae166c823e535eb731f333522" ON "knowledge_base" ("ai_provider_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "kb_folder" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "knowledge_base_id" uuid NOT NULL, "parent_id" uuid, "deleted_at" TIMESTAMP, CONSTRAINT "PK_b9ecced097312ba705828ad18f6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e30495d9d58f03974ddb00e41" ON "kb_folder" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d2894f1d96b1fe3584dfb33f12" ON "kb_folder" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90bdb62e2873c36f5a26dea02d" ON "kb_folder" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d75bd458c36ccad6a3d784cfb8" ON "kb_folder" ("knowledge_base_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_161009326bd37f66e42195ef61" ON "kb_folder" ("parent_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "kb_document" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "title" character varying, "content" text NOT NULL, "file_type" character varying, "file_url" character varying, "mime_type" character varying, "metadata" jsonb, "source_url" character varying, "knowledge_base_id" uuid NOT NULL, "folder_id" uuid, "processing_status" character varying NOT NULL DEFAULT 'pending', "chunk_count" integer NOT NULL DEFAULT '0', "processing_error" character varying, "file_size" character varying, "type" character varying, "tags" text, "source_type" character varying NOT NULL DEFAULT 'manual', "deleted_at" TIMESTAMP, CONSTRAINT "PK_cfd7a475c9ae4d40a976c8bbb65" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7c44d88070b87827a5080417fb" ON "kb_document" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e98a2d3732711bfa802d8de314" ON "kb_document" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27502483bae6d6acfd3e3fb54a" ON "kb_document" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6c8e6bf48a8e54a880d7f36255" ON "kb_document" ("metadata") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ee0459e7db0b730836e102d9b" ON "kb_document" ("knowledge_base_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e0a623b6a641e6cb084ffd1ae8" ON "kb_document" ("folder_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "kb_document_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "document_id" uuid NOT NULL, "version" integer NOT NULL, "content" text NOT NULL, "metadata" jsonb, "created_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_33b9d0a0699eacfbd6c40df6bb7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c348ba14b55e6e3452b050a612" ON "kb_document_version" ("document_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "rag_feedback" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "knowledge_base_id" uuid NOT NULL, "document_id" uuid, "user_id" uuid NOT NULL, "bot_id" uuid NOT NULL, "question" text NOT NULL, "answer" text NOT NULL, "sources" jsonb NOT NULL, "rating" integer, "feedback" character varying, "is_helpful" boolean, "deleted_at" TIMESTAMP, CONSTRAINT "PK_ac681653e6fd694d603a4674999" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8dd430b9ff87f366fdcb309174" ON "rag_feedback" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b0eac5cbe2159dc9070a1e52b" ON "rag_feedback" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63df9e4b536dbf43f90e8d43da" ON "rag_feedback" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eca4b4cdf538be462b42c7c65c" ON "rag_feedback" ("knowledge_base_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c28603c727679940ff131eda9f" ON "rag_feedback" ("document_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d12ed4537e1103cd11cfe1b51c" ON "rag_feedback" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d8d931d5410e54404e3ee0f29c" ON "rag_feedback" ("bot_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "channel_credential" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider" character varying NOT NULL, "name" character varying, "clientId" character varying, "clientSecret" character varying, "scopes" character varying, "isActive" boolean NOT NULL DEFAULT true, "metadata" jsonb DEFAULT '{}', CONSTRAINT "PK_dac10e98607782ecfb6bd9b141e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2e364ef7d5ed635ad687108fca" ON "channel_credential" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_79bddc0e876a5411dbef2e07a3" ON "channel_credential" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1f2d694339d77e45ee561a6ef" ON "channel_credential" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7759e3294e12c1bd976f2ca8ac" ON "channel_credential" ("provider") `,
    );
    await queryRunner.query(
      `CREATE TABLE "kb_chunk" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "document_id" uuid NOT NULL, "knowledge_base_id" uuid NOT NULL, "chunk_index" integer NOT NULL, "start_char" integer, "end_char" integer, "token_count" integer, "embedding_status" character varying NOT NULL DEFAULT 'pending', "embedding_error" character varying, "vector_id" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_53f290237ff06a63b55ae7f23c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f37a6fd48b5ba27e7da2d4a8e6" ON "kb_chunk" ("document_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9e43161d0e1e48cc608513802" ON "kb_chunk" ("knowledge_base_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "channel_connection" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL, "credential_id" uuid, "access_token" character varying, "metadata" jsonb, "status" character varying NOT NULL DEFAULT 'active', "connected_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f0b0b90fa3837ad5470c942462d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_55d874410302583167f7759e08" ON "channel_connection" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_838080dea10a1362428cf3531a" ON "channel_connection" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_71cbc2a4ea0a14c8105f2492b6" ON "channel_connection" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81d0c0117227d233206d06fa95" ON "channel_connection" ("type") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."generation_job_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "generation_job" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "creation_tool_id" character varying, "template_id" uuid NOT NULL, "workspace_id" uuid NOT NULL, "user_id" uuid, "input_data" jsonb NOT NULL, "output_data" jsonb, "status" "public"."generation_job_status_enum" NOT NULL DEFAULT 'pending', "error" text, "project_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_0fcaa0aa0c5e6620b8d5e1dce12" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e981766710199aee9044059535" ON "generation_job" ("creation_tool_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d9817f15f65160045f6ce17a7" ON "generation_job" ("template_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_85bb46ab0e7487aac995d9f4ab" ON "generation_job" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_329b3c559505b27f6971e78889" ON "generation_job" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cae7fcf4df2fef4e5669b6f3fb" ON "generation_job" ("project_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "path" character varying NOT NULL, "bucket" character varying NOT NULL DEFAULT 'images', "original_name" character varying, "size" integer, "mime_type" character varying, "workspace_id" uuid, "created_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "is_temp" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4974649383ab4efd579981415" ON "file" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "widget_version" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bot_id" uuid NOT NULL, "version" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'draft', "is_active" boolean NOT NULL DEFAULT false, "config" jsonb NOT NULL, "published_at" TIMESTAMP, "published_by" uuid, "cdn_url" character varying(500), "changelog" text, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fd4fd7ecfa5a3c040d85ce9be7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_73d825a2b5257fecae3fa44391" ON "widget_version" ("bot_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eec8048c9de6987375d69bce8f" ON "widget_version" ("bot_id", "is_active") WHERE is_active = true`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_869c687d5115dda182f23c3d7d" ON "widget_version" ("bot_id", "version") `,
    );
    await queryRunner.query(
      `CREATE TABLE "bot" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "avatar_url" character varying, "default_language" character varying NOT NULL DEFAULT 'en', "timezone" character varying NOT NULL DEFAULT 'UTC', "status" character varying NOT NULL DEFAULT 'draft', "icon" character varying DEFAULT 'FiMessageSquare', "is_active" boolean NOT NULL DEFAULT true, "flow_id" uuid, "system_prompt" text, "functions" text, "function_config" jsonb, "ai_provider_id" uuid, "ai_model_name" character varying, "ai_parameters" jsonb, "enable_auto_learn" boolean NOT NULL DEFAULT false, "allowed_origins" jsonb, "active_version_id" uuid, "deleted_at" TIMESTAMP, CONSTRAINT "REL_dd8bd6dec0d0732d267d6a826e" UNIQUE ("active_version_id"), CONSTRAINT "PK_bc6d59d7870eb2efd5f7f61e5ca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e45750f69e8b0280974c298b82" ON "bot" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6ef507e30b809a5fb72ebc82f" ON "bot" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b284789e01aa0cb894f068bde1" ON "bot" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE TABLE "bot_knowledge_base" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "bot_id" uuid NOT NULL, "knowledge_base_id" uuid NOT NULL, "priority" integer NOT NULL DEFAULT '1', "rag_settings" jsonb, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_159a73113affedc7d5638ce6c2b" PRIMARY KEY ("bot_id", "knowledge_base_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b0ff8c2803b9a475e9425a9e1" ON "bot_knowledge_base" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6de4356d7c09638179fc0f1bd5" ON "bot_knowledge_base" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_989145efd8f98d7bc45526feda" ON "bot_knowledge_base" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_159a73113affedc7d5638ce6c2" ON "bot_knowledge_base" ("bot_id", "knowledge_base_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "contact" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "external_id" character varying, "name" character varying, "avatar" character varying, "email" character varying, "phone" character varying, "metadata" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04add1d4bdb1bcdc17ddbe14ba" ON "contact" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91400f9d0d24a4ac59ca729e8f" ON "contact" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a755b72cbd084fa67236ac56ee" ON "contact" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_33d4fc93803e7192e150216fff" ON "contact" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf18df873779733cdbb1f69aa4" ON "contact" ("external_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eff09bb429f175523787f46003" ON "contact" ("email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f9f62556c7092913f2a0697505" ON "contact" ("phone") `,
    );
    await queryRunner.query(
      `CREATE TABLE "conversation" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bot_id" uuid NOT NULL, "channel_type" character varying NOT NULL DEFAULT 'web', "channel_id" uuid, "contact_id" uuid, "metadata" jsonb NOT NULL DEFAULT '{}', "status" character varying NOT NULL DEFAULT 'active', "last_message_at" TIMESTAMP, "handover_ticket_id" uuid, "external_id" character varying, "source" character varying NOT NULL DEFAULT 'web', "type" character varying NOT NULL DEFAULT 'support', "deleted_at" TIMESTAMP, CONSTRAINT "PK_864528ec4274360a40f66c29845" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef32ab8bf06d335895fa097234" ON "conversation" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d7d2f62f201c1f8d080a676ba0" ON "conversation" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b936c34795881d52b4b55c29f4" ON "conversation" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aaebf689e2996177947248df93" ON "conversation" ("bot_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91fdb6236859404ddf7c5f6437" ON "conversation" ("channel_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_497e6b0cfc02cd94483f194b8b" ON "conversation" ("contact_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a7c3ed343e7f845aa8cde41ec6" ON "conversation" ("metadata") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d448862b6090e5239102fb2db" ON "conversation" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4414991bced54350c7ad1378fc" ON "conversation" ("last_message_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b6a81d0030252361a6a7326dd5" ON "conversation" ("external_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05d35afe5e0fe4f429ba535202" ON "conversation" ("source") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cac593c4d9dcdf0119c92f7c8d" ON "conversation" ("type") `,
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "role" character varying NOT NULL DEFAULT 'user', "content" text NOT NULL, "attachments" jsonb, "metadata" jsonb NOT NULL DEFAULT '{}', "sources" jsonb, "tool_calls" jsonb, "feedback" character varying, "feedback_comment" text, "sender" character varying, "sent_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13b9c0c77528a5bae2299d3fcc" ON "message" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6dba64e650488c2002acf3fd18" ON "message" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c36a97143e982e005f0055b397" ON "message" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7fe3e887d78498d9c9813375ce" ON "message" ("conversation_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7ef021fc5aaa4d1f58fad2ab90" ON "message" ("metadata") `,
    );
    await queryRunner.query(
      `CREATE TABLE "message_feedback" ("message_id" uuid NOT NULL, "rating" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ca21e42f59ad7a1f2638a86aedf" PRIMARY KEY ("message_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ai_conversation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying NOT NULL, "bot_id" uuid, "use_knowledge_base" boolean NOT NULL DEFAULT false, "metadata" jsonb NOT NULL DEFAULT '{}', "messages" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_c5c36eee51de52a151fb73f7a51" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1bdb0ba34522870a1d86dc4514" ON "ai_conversation" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8718c0c649f54b2e26e819018e" ON "ai_conversation" ("bot_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."creation_jobs_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "creation_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."creation_jobs_status_enum" NOT NULL DEFAULT 'PENDING', "creation_tool_id" uuid NOT NULL, "input_data" jsonb NOT NULL, "output_data" jsonb, "progress" double precision NOT NULL DEFAULT '0', "created_by" uuid, "workspace_id" uuid, "error" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0470db42c173417a5d97582dfae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_165945df826afa8e2598cad390" ON "creation_jobs" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0860b0fd7e2de8558dc7287b60" ON "creation_jobs" ("creation_tool_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e0a3845e1d887f9c3397ca91d" ON "creation_jobs" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38595fae8b3f5c7ef884a2bdef" ON "creation_jobs" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "channel" ("workspace_id" uuid NOT NULL, "created_by" uuid, "updated_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bot_id" uuid NOT NULL, "connection_id" uuid, "type" character varying NOT NULL, "name" character varying NOT NULL, "config" jsonb, "is_active" boolean NOT NULL DEFAULT true, "connected_at" TIMESTAMP, CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_54d184fa863ba93b007e8dcc27" ON "channel" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf9c25c4068a5913cf57cb3276" ON "channel" ("created_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff5a82ccfb1591f2997031d920" ON "channel" ("updated_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_82da258fe45382a03c820a8daf" ON "channel" ("bot_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0b0b90fa3837ad5470c942462" ON "channel" ("connection_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "character" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "metadata" jsonb, "workspace_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_6c4aec48c564968be15078b8ae5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d80158dde1461b74ed8499e7d8" ON "character" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6f45be0cd8b83f0b05b66f360" ON "character" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "widget_deployment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bot_id" uuid NOT NULL, "widget_version_id" uuid NOT NULL, "deployed_by" uuid, "deployed_at" TIMESTAMP NOT NULL DEFAULT NOW(), "deployment_type" character varying(20) NOT NULL, "previous_version_id" uuid, "rollback_reason" text, "traffic_percentage" integer NOT NULL DEFAULT '100', "status" character varying(20) NOT NULL, "metadata" jsonb, CONSTRAINT "PK_641e3fb1795f929ccdc94741648" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_46f3d06fc514b5dbd701949d22" ON "widget_deployment" ("bot_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_844910ae4694cdde8c1c428cc9" ON "widget_deployment" ("widget_version_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0cc3da9bd6517136ef4a68fec3" ON "widget_deployment" ("deployed_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "workspace_id" uuid NOT NULL, "action" character varying NOT NULL, "resource_type" character varying NOT NULL, "resource_id" character varying NOT NULL, "details" jsonb, "ip_address" character varying, "user_agent" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cb11bd5b662431ea0ac455a27d" ON "audit_log" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d65f841d6520dc60a9dfcb9367" ON "audit_log" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_951e6339a77994dfbad976b35c" ON "audit_log" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a7f36346480a56b810efea4a2" ON "audit_log" ("resource_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ad7930a7c2af80585c8c1b770" ON "audit_log" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "data_access_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "workspace_id" uuid NOT NULL, "table_name" character varying NOT NULL, "record_id" character varying NOT NULL, "action" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08f41b4079fc059dfbba953808b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_540a1d7e19f73eed9317c514b7" ON "data_access_log" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f7f36a37f00bf828c64235a64f" ON "data_access_log" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1306d6c971218f52de9eb25871" ON "data_access_log" ("table_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7b6ddcbc20f35c452fbde742e8" ON "data_access_log" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permission" ("role_id" integer NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_19a94c31d4960ded0dcd0397759" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d0a7155eafd75ddba5a701336" ON "role_permission" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3a3ba47b7ca00fd23be4ebd6c" ON "role_permission" ("permission_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_fb2e442d14add3cefbdf33c4561" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ADD CONSTRAINT "FK_988cf8ee530a5f8a2d56269955b" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_1f89bf9533ffa200b64f4ef35db" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_73d466cb93234025fe379fa5873" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" ADD CONSTRAINT "FK_82b74268d8b7e1574fd744b3903" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "FK_7299ed156a084d7e97df80b7ff6" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ai_provider_configs" ADD CONSTRAINT "FK_bca82934cd53e143c74a2ff97c5" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ai_provider_configs" ADD CONSTRAINT "FK_ec0f1703bed5fb29ea5e0afe160" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_ai_provider_configs" ADD CONSTRAINT "FK_3522a3e473b56a703fe8d98c950" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_ai_provider_configs" ADD CONSTRAINT "FK_2a55b8ba19368d0e6499ba5df1b" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage_log" ADD CONSTRAINT "FK_d4b3d0a0eac463e2224513fff7c" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage_log" ADD CONSTRAINT "FK_d7b00762ea27339b5f6ea53bfac" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" ADD CONSTRAINT "FK_cb864e5c2393a73bc65bf73c704" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" ADD CONSTRAINT "FK_83f254c75e90fc991a47522da75" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" ADD CONSTRAINT "FK_a72acd3aadc3ce48a8177ac4593" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" ADD CONSTRAINT "FK_526f0affaf8cba58a06823a529b" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_9b6a7e06a23a072d065e6790dcb" FOREIGN KEY ("creation_tool_id") REFERENCES "creation_tool"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_fcc56203b1c92e296f3a1ab2e74" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" ADD CONSTRAINT "FK_6026acc5aa817269a5f74635264" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" ADD CONSTRAINT "FK_5fde988e5d9b9a522d70ebec27c" FOREIGN KEY ("plan_id") REFERENCES "plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_quota" ADD CONSTRAINT "FK_3e28b611f0efceaff91771f9b04" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD CONSTRAINT "FK_a85d07a63679df4dd094bfc756a" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" ADD CONSTRAINT "FK_5d9508325a862b5b3c7c819de3e" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" ADD CONSTRAINT "FK_f39683bc3c87e158ee5afffdbac" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_folder" ADD CONSTRAINT "FK_3e30495d9d58f03974ddb00e41d" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_folder" ADD CONSTRAINT "FK_d75bd458c36ccad6a3d784cfb81" FOREIGN KEY ("knowledge_base_id") REFERENCES "knowledge_base"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_folder" ADD CONSTRAINT "FK_161009326bd37f66e42195ef61d" FOREIGN KEY ("parent_id") REFERENCES "kb_folder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_document" ADD CONSTRAINT "FK_7c44d88070b87827a5080417fb8" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_document" ADD CONSTRAINT "FK_6ee0459e7db0b730836e102d9b1" FOREIGN KEY ("knowledge_base_id") REFERENCES "knowledge_base"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_document" ADD CONSTRAINT "FK_e0a623b6a641e6cb084ffd1ae8c" FOREIGN KEY ("folder_id") REFERENCES "kb_folder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_document_version" ADD CONSTRAINT "FK_c348ba14b55e6e3452b050a6129" FOREIGN KEY ("document_id") REFERENCES "kb_document"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rag_feedback" ADD CONSTRAINT "FK_8dd430b9ff87f366fdcb3091746" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_credential" ADD CONSTRAINT "FK_2e364ef7d5ed635ad687108fcab" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD CONSTRAINT "FK_55d874410302583167f7759e085" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" ADD CONSTRAINT "FK_22a26194e6dca7ad6913d6152d5" FOREIGN KEY ("credential_id") REFERENCES "channel_credential"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "generation_job" ADD CONSTRAINT "FK_2d9817f15f65160045f6ce17a76" FOREIGN KEY ("template_id") REFERENCES "template"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" ADD CONSTRAINT "FK_b4974649383ab4efd579981415b" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "widget_version" ADD CONSTRAINT "FK_73d825a2b5257fecae3fa443911" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" ADD CONSTRAINT "FK_e45750f69e8b0280974c298b82f" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" ADD CONSTRAINT "FK_58487db73d419a07163400cd26b" FOREIGN KEY ("ai_provider_id") REFERENCES "ai_providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" ADD CONSTRAINT "FK_dd8bd6dec0d0732d267d6a826e7" FOREIGN KEY ("active_version_id") REFERENCES "widget_version"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot_knowledge_base" ADD CONSTRAINT "FK_8b0ff8c2803b9a475e9425a9e1d" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot_knowledge_base" ADD CONSTRAINT "FK_d00741d566a15f9b57e535c022c" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD CONSTRAINT "FK_04add1d4bdb1bcdc17ddbe14ba2" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" ADD CONSTRAINT "FK_33d4fc93803e7192e150216fffb" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_ef32ab8bf06d335895fa0972340" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_497e6b0cfc02cd94483f194b8bc" FOREIGN KEY ("contact_id") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" ADD CONSTRAINT "FK_aaebf689e2996177947248df934" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_13b9c0c77528a5bae2299d3fcc5" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_7fe3e887d78498d9c9813375ce2" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_feedback" ADD CONSTRAINT "FK_ca21e42f59ad7a1f2638a86aedf" FOREIGN KEY ("message_id") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversation" ADD CONSTRAINT "FK_4eb1cdcb75977fe6774fad6f654" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" ADD CONSTRAINT "FK_0860b0fd7e2de8558dc7287b606" FOREIGN KEY ("creation_tool_id") REFERENCES "creation_tool"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ADD CONSTRAINT "FK_54d184fa863ba93b007e8dcc279" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ADD CONSTRAINT "FK_82da258fe45382a03c820a8daf4" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" ADD CONSTRAINT "FK_f0b0b90fa3837ad5470c942462d" FOREIGN KEY ("connection_id") REFERENCES "channel_connection"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "widget_deployment" ADD CONSTRAINT "FK_46f3d06fc514b5dbd701949d225" FOREIGN KEY ("bot_id") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "widget_deployment" ADD CONSTRAINT "FK_844910ae4694cdde8c1c428cc95" FOREIGN KEY ("widget_version_id") REFERENCES "widget_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "widget_deployment" ADD CONSTRAINT "FK_f987c08d3958a63f35012a2186d" FOREIGN KEY ("previous_version_id") REFERENCES "widget_version"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permission" ADD CONSTRAINT "FK_3d0a7155eafd75ddba5a7013368" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permission" ADD CONSTRAINT "FK_e3a3ba47b7ca00fd23be4ebd6cf" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_permission" DROP CONSTRAINT "FK_e3a3ba47b7ca00fd23be4ebd6cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permission" DROP CONSTRAINT "FK_3d0a7155eafd75ddba5a7013368"`,
    );
    await queryRunner.query(
      `ALTER TABLE "widget_deployment" DROP CONSTRAINT "FK_f987c08d3958a63f35012a2186d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "widget_deployment" DROP CONSTRAINT "FK_844910ae4694cdde8c1c428cc95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "widget_deployment" DROP CONSTRAINT "FK_46f3d06fc514b5dbd701949d225"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" DROP CONSTRAINT "FK_f0b0b90fa3837ad5470c942462d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" DROP CONSTRAINT "FK_82da258fe45382a03c820a8daf4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel" DROP CONSTRAINT "FK_54d184fa863ba93b007e8dcc279"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_jobs" DROP CONSTRAINT "FK_0860b0fd7e2de8558dc7287b606"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversation" DROP CONSTRAINT "FK_4eb1cdcb75977fe6774fad6f654"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_feedback" DROP CONSTRAINT "FK_ca21e42f59ad7a1f2638a86aedf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_7fe3e887d78498d9c9813375ce2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_13b9c0c77528a5bae2299d3fcc5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_aaebf689e2996177947248df934"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_497e6b0cfc02cd94483f194b8bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_ef32ab8bf06d335895fa0972340"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" DROP CONSTRAINT "FK_33d4fc93803e7192e150216fffb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contact" DROP CONSTRAINT "FK_04add1d4bdb1bcdc17ddbe14ba2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot_knowledge_base" DROP CONSTRAINT "FK_d00741d566a15f9b57e535c022c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot_knowledge_base" DROP CONSTRAINT "FK_8b0ff8c2803b9a475e9425a9e1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" DROP CONSTRAINT "FK_dd8bd6dec0d0732d267d6a826e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" DROP CONSTRAINT "FK_58487db73d419a07163400cd26b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot" DROP CONSTRAINT "FK_e45750f69e8b0280974c298b82f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "widget_version" DROP CONSTRAINT "FK_73d825a2b5257fecae3fa443911"`,
    );
    await queryRunner.query(
      `ALTER TABLE "file" DROP CONSTRAINT "FK_b4974649383ab4efd579981415b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "generation_job" DROP CONSTRAINT "FK_2d9817f15f65160045f6ce17a76"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP CONSTRAINT "FK_22a26194e6dca7ad6913d6152d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_connection" DROP CONSTRAINT "FK_55d874410302583167f7759e085"`,
    );
    await queryRunner.query(
      `ALTER TABLE "channel_credential" DROP CONSTRAINT "FK_2e364ef7d5ed635ad687108fcab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rag_feedback" DROP CONSTRAINT "FK_8dd430b9ff87f366fdcb3091746"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_document_version" DROP CONSTRAINT "FK_c348ba14b55e6e3452b050a6129"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_document" DROP CONSTRAINT "FK_e0a623b6a641e6cb084ffd1ae8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_document" DROP CONSTRAINT "FK_6ee0459e7db0b730836e102d9b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_document" DROP CONSTRAINT "FK_7c44d88070b87827a5080417fb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_folder" DROP CONSTRAINT "FK_161009326bd37f66e42195ef61d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_folder" DROP CONSTRAINT "FK_d75bd458c36ccad6a3d784cfb81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kb_folder" DROP CONSTRAINT "FK_3e30495d9d58f03974ddb00e41d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "knowledge_base" DROP CONSTRAINT "FK_f39683bc3c87e158ee5afffdbac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT "FK_5d9508325a862b5b3c7c819de3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoice" DROP CONSTRAINT "FK_a85d07a63679df4dd094bfc756a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usage_quota" DROP CONSTRAINT "FK_3e28b611f0efceaff91771f9b04"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT "FK_5fde988e5d9b9a522d70ebec27c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription" DROP CONSTRAINT "FK_6026acc5aa817269a5f74635264"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_fcc56203b1c92e296f3a1ab2e74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_9b6a7e06a23a072d065e6790dcb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "creation_tool" DROP CONSTRAINT "FK_526f0affaf8cba58a06823a529b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" DROP CONSTRAINT "FK_a72acd3aadc3ce48a8177ac4593"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" DROP CONSTRAINT "FK_83f254c75e90fc991a47522da75"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitation" DROP CONSTRAINT "FK_cb864e5c2393a73bc65bf73c704"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage_log" DROP CONSTRAINT "FK_d7b00762ea27339b5f6ea53bfac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_usage_log" DROP CONSTRAINT "FK_d4b3d0a0eac463e2224513fff7c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_ai_provider_configs" DROP CONSTRAINT "FK_2a55b8ba19368d0e6499ba5df1b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_ai_provider_configs" DROP CONSTRAINT "FK_3522a3e473b56a703fe8d98c950"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ai_provider_configs" DROP CONSTRAINT "FK_ec0f1703bed5fb29ea5e0afe160"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_ai_provider_configs" DROP CONSTRAINT "FK_bca82934cd53e143c74a2ff97c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_provider_configs" DROP CONSTRAINT "FK_7299ed156a084d7e97df80b7ff6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_82b74268d8b7e1574fd744b3903"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_73d466cb93234025fe379fa5873"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_member" DROP CONSTRAINT "FK_1f89bf9533ffa200b64f4ef35db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" DROP CONSTRAINT "FK_988cf8ee530a5f8a2d56269955b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "FK_fb2e442d14add3cefbdf33c4561"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e3a3ba47b7ca00fd23be4ebd6c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d0a7155eafd75ddba5a701336"`,
    );
    await queryRunner.query(`DROP TABLE "role_permission"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7b6ddcbc20f35c452fbde742e8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1306d6c971218f52de9eb25871"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f7f36a37f00bf828c64235a64f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_540a1d7e19f73eed9317c514b7"`,
    );
    await queryRunner.query(`DROP TABLE "data_access_log"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2ad7930a7c2af80585c8c1b770"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a7f36346480a56b810efea4a2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_951e6339a77994dfbad976b35c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d65f841d6520dc60a9dfcb9367"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb11bd5b662431ea0ac455a27d"`,
    );
    await queryRunner.query(`DROP TABLE "audit_log"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0cc3da9bd6517136ef4a68fec3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_844910ae4694cdde8c1c428cc9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_46f3d06fc514b5dbd701949d22"`,
    );
    await queryRunner.query(`DROP TABLE "widget_deployment"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a6f45be0cd8b83f0b05b66f360"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d80158dde1461b74ed8499e7d8"`,
    );
    await queryRunner.query(`DROP TABLE "character"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f0b0b90fa3837ad5470c942462"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82da258fe45382a03c820a8daf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff5a82ccfb1591f2997031d920"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bf9c25c4068a5913cf57cb3276"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_54d184fa863ba93b007e8dcc27"`,
    );
    await queryRunner.query(`DROP TABLE "channel"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_38595fae8b3f5c7ef884a2bdef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e0a3845e1d887f9c3397ca91d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0860b0fd7e2de8558dc7287b60"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_165945df826afa8e2598cad390"`,
    );
    await queryRunner.query(`DROP TABLE "creation_jobs"`);
    await queryRunner.query(`DROP TYPE "public"."creation_jobs_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8718c0c649f54b2e26e819018e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1bdb0ba34522870a1d86dc4514"`,
    );
    await queryRunner.query(`DROP TABLE "ai_conversation"`);
    await queryRunner.query(`DROP TABLE "message_feedback"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7ef021fc5aaa4d1f58fad2ab90"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7fe3e887d78498d9c9813375ce"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c36a97143e982e005f0055b397"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6dba64e650488c2002acf3fd18"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13b9c0c77528a5bae2299d3fcc"`,
    );
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cac593c4d9dcdf0119c92f7c8d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05d35afe5e0fe4f429ba535202"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b6a81d0030252361a6a7326dd5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4414991bced54350c7ad1378fc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0d448862b6090e5239102fb2db"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a7c3ed343e7f845aa8cde41ec6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_497e6b0cfc02cd94483f194b8b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_91fdb6236859404ddf7c5f6437"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aaebf689e2996177947248df93"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b936c34795881d52b4b55c29f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d7d2f62f201c1f8d080a676ba0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef32ab8bf06d335895fa097234"`,
    );
    await queryRunner.query(`DROP TABLE "conversation"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f9f62556c7092913f2a0697505"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eff09bb429f175523787f46003"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bf18df873779733cdbb1f69aa4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_33d4fc93803e7192e150216fff"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a755b72cbd084fa67236ac56ee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_91400f9d0d24a4ac59ca729e8f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_04add1d4bdb1bcdc17ddbe14ba"`,
    );
    await queryRunner.query(`DROP TABLE "contact"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_159a73113affedc7d5638ce6c2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_989145efd8f98d7bc45526feda"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6de4356d7c09638179fc0f1bd5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b0ff8c2803b9a475e9425a9e1"`,
    );
    await queryRunner.query(`DROP TABLE "bot_knowledge_base"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b284789e01aa0cb894f068bde1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6ef507e30b809a5fb72ebc82f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e45750f69e8b0280974c298b82"`,
    );
    await queryRunner.query(`DROP TABLE "bot"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_869c687d5115dda182f23c3d7d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eec8048c9de6987375d69bce8f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_73d825a2b5257fecae3fa44391"`,
    );
    await queryRunner.query(`DROP TABLE "widget_version"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4974649383ab4efd579981415"`,
    );
    await queryRunner.query(`DROP TABLE "file"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cae7fcf4df2fef4e5669b6f3fb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_329b3c559505b27f6971e78889"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_85bb46ab0e7487aac995d9f4ab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d9817f15f65160045f6ce17a7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e981766710199aee9044059535"`,
    );
    await queryRunner.query(`DROP TABLE "generation_job"`);
    await queryRunner.query(`DROP TYPE "public"."generation_job_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81d0c0117227d233206d06fa95"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_71cbc2a4ea0a14c8105f2492b6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_838080dea10a1362428cf3531a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_55d874410302583167f7759e08"`,
    );
    await queryRunner.query(`DROP TABLE "channel_connection"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9e43161d0e1e48cc608513802"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f37a6fd48b5ba27e7da2d4a8e6"`,
    );
    await queryRunner.query(`DROP TABLE "kb_chunk"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7759e3294e12c1bd976f2ca8ac"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1f2d694339d77e45ee561a6ef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_79bddc0e876a5411dbef2e07a3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2e364ef7d5ed635ad687108fca"`,
    );
    await queryRunner.query(`DROP TABLE "channel_credential"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d8d931d5410e54404e3ee0f29c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d12ed4537e1103cd11cfe1b51c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c28603c727679940ff131eda9f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eca4b4cdf538be462b42c7c65c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_63df9e4b536dbf43f90e8d43da"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b0eac5cbe2159dc9070a1e52b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8dd430b9ff87f366fdcb309174"`,
    );
    await queryRunner.query(`DROP TABLE "rag_feedback"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c348ba14b55e6e3452b050a612"`,
    );
    await queryRunner.query(`DROP TABLE "kb_document_version"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e0a623b6a641e6cb084ffd1ae8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ee0459e7db0b730836e102d9b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6c8e6bf48a8e54a880d7f36255"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_27502483bae6d6acfd3e3fb54a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e98a2d3732711bfa802d8de314"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7c44d88070b87827a5080417fb"`,
    );
    await queryRunner.query(`DROP TABLE "kb_document"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_161009326bd37f66e42195ef61"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d75bd458c36ccad6a3d784cfb8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_90bdb62e2873c36f5a26dea02d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d2894f1d96b1fe3584dfb33f12"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e30495d9d58f03974ddb00e41"`,
    );
    await queryRunner.query(`DROP TABLE "kb_folder"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ae166c823e535eb731f333522"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_494eaf1b1f45f0ffd71bef6a1b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a47b1575e8f2c2cc377a9cc40f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f39683bc3c87e158ee5afffdba"`,
    );
    await queryRunner.query(`DROP TABLE "knowledge_base"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8bdc07e9c41ce8d83730f0f5d8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aedc307c7e60ecb138e3f90ff8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f7d684c30d9d0cdbc24322de8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_928b7aa1754e08e1ed7052cb9d"`,
    );
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5cb157e3d3ab8abd16251129db"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dedfea394088ed136ddadeee89"`,
    );
    await queryRunner.query(`DROP TABLE "project"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"`,
    );
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c77899995a4a2887a85d722279"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f79152848380534cf3a31add03"`,
    );
    await queryRunner.query(`DROP TABLE "style_preset"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5d9508325a862b5b3c7c819de3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a85d07a63679df4dd094bfc756"`,
    );
    await queryRunner.query(`DROP TABLE "invoice"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_192fa04382405c62d6e7a0eedf"`,
    );
    await queryRunner.query(`DROP TABLE "usage_quota"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4919f4488c35799176dfd3c143"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c60cbdbd21c49a01596ec24d1f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5fde988e5d9b9a522d70ebec27"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6026acc5aa817269a5f7463526"`,
    );
    await queryRunner.query(`DROP TABLE "subscription"`);
    await queryRunner.query(`DROP TABLE "plan"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f8b9d372187ad54c33210721d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_941289df174d4ece7998279a6c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a62147c0d6b868e797061e142a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9b6a7e06a23a072d065e6790dc"`,
    );
    await queryRunner.query(`DROP TABLE "template"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd6e013d98ac33e10aea9137cc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1a0e54dd330805ccb6486814ef"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_712006d033481a0b3e43313276"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_39f0a0ce96e591d2aff915fb32"`,
    );
    await queryRunner.query(`DROP TABLE "creation_tool"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_63ad76a14a8321d22dc0a5e704"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cb73208f151aa71cdd78f662d7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_23c05c292c439d77b0de816b50"`,
    );
    await queryRunner.query(`DROP TABLE "category"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c9c20a97f6b381386a315f74c3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_63a1ffd56c6903021d2c5b6aaa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0253cc148d22e4ba68ca3ededf"`,
    );
    await queryRunner.query(`DROP TABLE "webhook_event"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_49e1b235ed0b102d72b8f299d6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_353a007588fb0ce02e603f1a67"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_invitation"`);
    await queryRunner.query(`DROP TABLE "system_ai_settings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_18f3bc73d7d2692f732cc974f0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d7b00762ea27339b5f6ea53bfa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_581a0ff70741335110a92e8a18"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5f07b3eb775938e5d5dfc5843b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d4b3d0a0eac463e2224513fff7"`,
    );
    await queryRunner.query(`DROP TABLE "ai_usage_log"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a55b8ba19368d0e6499ba5df1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a9a6100cbec33ef94cd06e46fe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d05834339513f9800bc9a6915"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3522a3e473b56a703fe8d98c95"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_ai_provider_configs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec0f1703bed5fb29ea5e0afe16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bca82934cd53e143c74a2ff97c"`,
    );
    await queryRunner.query(`DROP TABLE "user_ai_provider_configs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b4e4ef106d84e38e8577cd965d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2bdd8f45e064bac6f99cbbe91d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7299ed156a084d7e97df80b7ff"`,
    );
    await queryRunner.query(`DROP TABLE "ai_provider_configs"`);
    await queryRunner.query(`DROP TABLE "ai_providers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0eab76d5a9c509930a9f3d7a10"`,
    );
    await queryRunner.query(`DROP TABLE "workspace_member"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0d706c438a9b1ae0ac9806a201"`,
    );
    await queryRunner.query(`DROP TABLE "workspace"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0cd76a8cdee62eeff31d384b73"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6937e802be2946855a3ad0e6be"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7a4fd2a547828e5efe420e50d1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e3a2b86fd9a9c22c266ae0473"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e12875dfb3b1d92d7d7c5377e2"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "role"`);
    await queryRunner.query(`DROP TABLE "permission"`);
  }
}
