CREATE TABLE "dashboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinned_charts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"chart_type" varchar(50) NOT NULL,
	"connection_id" uuid NOT NULL,
	"session_id" uuid,
	"message_id" uuid,
	"sql" text NOT NULL,
	"question" text NOT NULL,
	"viz_config" jsonb NOT NULL,
	"cached_data" jsonb,
	"last_refreshed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_charts" ADD CONSTRAINT "pinned_charts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_charts" ADD CONSTRAINT "pinned_charts_dashboard_id_dashboards_id_fk" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_charts" ADD CONSTRAINT "pinned_charts_connection_id_database_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."database_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_charts" ADD CONSTRAINT "pinned_charts_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_charts" ADD CONSTRAINT "pinned_charts_message_id_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dashboards_user" ON "dashboards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pinned_charts_dashboard" ON "pinned_charts" USING btree ("dashboard_id");--> statement-breakpoint
CREATE INDEX "idx_pinned_charts_user" ON "pinned_charts" USING btree ("user_id");