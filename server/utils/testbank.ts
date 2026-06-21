import { db } from "../../db";
import { problems } from "../../db/schema";

export async function getTestbankMetadata(limit = 100) {
  return await db
    .select({
      title: problems.title,
      source: problems.source,
      hashtags: problems.hashtags,
      difficulty: problems.difficulty,
    })
    .from(problems)
    .limit(Math.min(Math.max(limit, 1), 100));
}
