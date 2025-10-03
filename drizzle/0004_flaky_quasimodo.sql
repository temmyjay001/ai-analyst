CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "queries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "queries" CASCADE;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "title" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "message_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_messages_session_created" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_updated" ON "chat_sessions" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_connection" ON "chat_sessions" USING btree ("connection_id");--> statement-breakpoint
ALTER TABLE "chat_sessions" DROP COLUMN "plan";--> statement-breakpoint
ALTER TABLE "chat_sessions" DROP COLUMN "is_multi_turn";