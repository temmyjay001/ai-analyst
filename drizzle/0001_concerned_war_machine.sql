ALTER TABLE "database_connections" ALTER COLUMN "host" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "database_connections" ALTER COLUMN "port" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "database_connections" ALTER COLUMN "database" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "database_connections" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "database_connections" ALTER COLUMN "password_encrypted" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "database_connections" ADD COLUMN "connection_url_encrypted" text;