import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, isNull } from "drizzle-orm";
import OpenAI from "openai";
import * as schema from "../db/schema";

const BATCH_SIZE = 100;

function buildEmbeddingText(problem: {
  title: string;
  content: string;
  explanation: string | null;
  subject: string | null;
  chapter: string | null;
  grade: string | null;
  hashtags: string[] | null;
}): string {
  const meta = [problem.subject, problem.grade, problem.chapter]
    .filter(Boolean)
    .map((s) => `[${s}]`)
    .join(" ");

  const tags = problem.hashtags?.length
    ? problem.hashtags.map((t) => `#${t}`).join(" ")
    : "";

  return [meta, problem.title, problem.content, problem.explanation, tags]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not found");
    process.exit(1);
  }

  const apiKey = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("EMBEDDING_API_KEY or OPENAI_API_KEY not found");
    process.exit(1);
  }

  const baseURL =
    process.env.EMBEDDING_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });
  const openai = new OpenAI({ baseURL, apiKey });

  const allProblems = await db
    .select({
      id: schema.problems.id,
      title: schema.problems.title,
      content: schema.problems.content,
      explanation: schema.problems.explanation,
      subject: schema.problems.subject,
      chapter: schema.problems.chapter,
      grade: schema.problems.grade,
      hashtags: schema.problems.hashtags,
    })
    .from(schema.problems)
    .where(isNull(schema.problems.embedding));

  console.log(`Found ${allProblems.length} problems without embeddings`);

  for (let i = 0; i < allProblems.length; i += BATCH_SIZE) {
    const batch = allProblems.slice(i, i + BATCH_SIZE);
    const texts = batch.map((p) => buildEmbeddingText(p));

    try {
      const response = await openai.embeddings.create({
        input: texts,
        model,
      });

      const embeddings = response.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding);

      for (let j = 0; j < batch.length; j++) {
        await db
          .update(schema.problems)
          .set({ embedding: embeddings[j] })
          .where(eq(schema.problems.id, batch[j].id));
      }

      console.log(
        `Processed ${Math.min(i + BATCH_SIZE, allProblems.length)}/${allProblems.length} problems`
      );
    } catch (err: any) {
      console.error(`Error processing batch at offset ${i}:`, err.message);
      if (err.status === 429) {
        console.log("Rate limited, waiting 60s...");
        await new Promise((r) => setTimeout(r, 60_000));
        i -= BATCH_SIZE; // retry this batch
      }
    }
  }

  console.log("Done!");
  await client.end();
}

main().catch(console.error);
