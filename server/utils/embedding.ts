import OpenAI from "openai";
import { problems } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

let _client: OpenAI | null = null;

function getClient() {
  if (!_client) {
    const config = useRuntimeConfig();
    _client = new OpenAI({
      baseURL: config.embeddingBaseUrl,
      apiKey: config.embeddingApiKey,
    });
  }
  return _client;
}

function getModel() {
  return useRuntimeConfig().embeddingModel;
}

export interface EmbeddingProblemData {
  title?: string | null;
  content?: string | null;
  explanation?: string | null;
  subject?: string | null;
  chapter?: string | null;
  grade?: string | null;
  hashtags?: string[] | null;
}

export function buildEmbeddingText(problem: EmbeddingProblemData): string {
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

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    input: text,
    model: getModel(),
  });
  return response.data[0]!.embedding;
}

export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const response = await getClient().embeddings.create({
    input: texts,
    model: getModel(),
  });
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function generateAndStoreEmbedding(
  problemId: string,
  problemData: EmbeddingProblemData
): Promise<void> {
  try {
    const text = buildEmbeddingText(problemData);
    const embedding = await generateEmbedding(text);
    await useDrizzle()
      .update(problems)
      .set({ embedding })
      .where(eq(problems.id, problemId));
  } catch (err: any) {
    console.warn(
      `Failed to generate embedding for problem ${problemId}:`,
      err.message
    );
  }
}
