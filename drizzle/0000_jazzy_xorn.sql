CREATE TABLE IF NOT EXISTS "embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_path" text NOT NULL,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"vector" vector(3072) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cache_key" text NOT NULL,
	"data" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "github_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"message_id" text NOT NULL,
	"content" text NOT NULL,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "embeddings_file_path_chunk_idx" ON "embeddings" USING btree ("file_path","chunk_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddings_file_path_idx" ON "embeddings" USING btree ("file_path");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddings_content_hash_idx" ON "embeddings" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_cache_key_expires_idx" ON "github_cache" USING btree ("cache_key","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "message_history_channel_message_idx" ON "message_history" USING btree ("channel_id","message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_history_channel_created_idx" ON "message_history" USING btree ("channel_id","created_at");