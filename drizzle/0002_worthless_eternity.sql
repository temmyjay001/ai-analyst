CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"plan" varchar(50) NOT NULL,
	"is_multi_turn" boolean DEFAULT false NOT NULL,
	"message_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "queries" ALTER COLUMN "question" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "queries" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "queries" ADD COLUMN "role" varchar(50);--> statement-breakpoint
ALTER TABLE "queries" ADD COLUMN "message_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_connection_id_database_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."database_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queries" ADD CONSTRAINT "queries_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;