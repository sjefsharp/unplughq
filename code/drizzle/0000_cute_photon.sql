CREATE TYPE "public"."alert_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('cpu-critical', 'ram-critical', 'disk-critical', 'app-unavailable', 'server-unreachable');--> statement-breakpoint
CREATE TYPE "public"."deployment_status" AS ENUM('pending', 'pulling', 'configuring', 'provisioning-ssl', 'starting', 'running', 'unhealthy', 'stopped', 'failed', 'removing');--> statement-breakpoint
CREATE TYPE "public"."server_status" AS ENUM('connecting', 'validated', 'provisioning', 'provisioned', 'connection-failed', 'provision-failed', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'team');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"app_id" uuid,
	"severity" "alert_severity" NOT NULL,
	"type" "alert_type" NOT NULL,
	"message" text NOT NULL,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"ip_address" text,
	"user_agent" text,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_apps" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"version" text NOT NULL,
	"min_cpu_cores" integer NOT NULL,
	"min_ram_gb" real NOT NULL,
	"min_disk_gb" real NOT NULL,
	"upstream_url" text NOT NULL,
	"image_digest" text NOT NULL,
	"config_schema" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"catalog_app_id" text NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"access_url" text,
	"status" "deployment_status" DEFAULT 'pending' NOT NULL,
	"container_name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"timestamp" timestamp NOT NULL,
	"cpu_percent" real NOT NULL,
	"ram_used_bytes" bigint NOT NULL,
	"ram_total_bytes" bigint NOT NULL,
	"disk_used_bytes" bigint NOT NULL,
	"disk_total_bytes" bigint NOT NULL,
	"network_rx_bytes_per_sec" bigint NOT NULL,
	"network_tx_bytes_per_sec" bigint NOT NULL,
	"containers" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"ip" text NOT NULL,
	"ssh_port" integer DEFAULT 22 NOT NULL,
	"ssh_user" text NOT NULL,
	"ssh_key_encrypted" text,
	"status" "server_status" DEFAULT 'connecting' NOT NULL,
	"os_name" text,
	"cpu_cores" integer,
	"ram_gb" real,
	"disk_gb" real,
	"api_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password_hash" text,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"notification_prefs" jsonb DEFAULT '{"emailAlerts":true}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_app_id_deployments_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."deployments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_catalog_app_id_catalog_apps_id_fk" FOREIGN KEY ("catalog_app_id") REFERENCES "public"."catalog_apps"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_snapshots" ADD CONSTRAINT "metrics_snapshots_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics_snapshots" ADD CONSTRAINT "metrics_snapshots_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servers" ADD CONSTRAINT "servers_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_idx" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alerts_tenant_id_created_at_idx" ON "alerts" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "alerts_server_id_idx" ON "alerts" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "alerts_tenant_server_type_dismissed_idx" ON "alerts" USING btree ("tenant_id","server_id","type","dismissed_at");--> statement-breakpoint
CREATE INDEX "audit_log_tenant_id_created_at_idx" ON "audit_log" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "catalog_apps_category_idx" ON "catalog_apps" USING btree ("category");--> statement-breakpoint
CREATE INDEX "deployments_tenant_id_idx" ON "deployments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "deployments_server_id_idx" ON "deployments" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "deployments_status_idx" ON "deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deployments_tenant_server_idx" ON "deployments" USING btree ("tenant_id","server_id");--> statement-breakpoint
CREATE INDEX "deployments_tenant_status_idx" ON "deployments" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "deployments_server_container_name_idx" ON "deployments" USING btree ("server_id","container_name");--> statement-breakpoint
CREATE INDEX "metrics_tenant_server_timestamp_idx" ON "metrics_snapshots" USING btree ("tenant_id","server_id","timestamp");--> statement-breakpoint
CREATE INDEX "metrics_server_id_timestamp_idx" ON "metrics_snapshots" USING btree ("server_id","timestamp");--> statement-breakpoint
CREATE INDEX "servers_tenant_id_idx" ON "servers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "servers_status_idx" ON "servers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");