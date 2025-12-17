import { db } from "../../db";
import { problems } from "../../db/schema";

export async function getTestbankMetadata() {
  return await db
    .select({
      title: problems.title,
      source: problems.source,
      hashtags: problems.hashtags,
      difficulty: problems.difficulty,
    })
    .from(problems);
}
