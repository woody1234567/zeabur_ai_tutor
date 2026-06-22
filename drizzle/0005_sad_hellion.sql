CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
CREATE INDEX "problems_embedding_idx" ON "problems" USING hnsw ("embedding" vector_cosine_ops);