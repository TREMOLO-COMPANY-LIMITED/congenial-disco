ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned_reason" text;