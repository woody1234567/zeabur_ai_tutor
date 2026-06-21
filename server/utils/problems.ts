import { db } from "../../db";
import { problems } from "../../db/schema";
import { and, or, ilike, sql } from "drizzle-orm";

export type SearchProblemsCriteria = {
  title?: string;
  source?: string;
  hashtag?: string;
  limit?: number;
};

export async function searchProblems(criteria: SearchProblemsCriteria) {
  const filters = [];

  if (criteria.title) {
    filters.push(
      or(
        ilike(problems.title, `%${criteria.title}%`),
        ilike(problems.content, `%${criteria.title}%`)
      )
    );
  }
  if (criteria.source) {
    filters.push(ilike(problems.source, `%${criteria.source}%`));
  }
  if (criteria.hashtag) {
    filters.push(
      sql`${problems.hashtags} @> ${JSON.stringify([criteria.hashtag])}`
    );
  }

  try {
    const results = await db
      .select({
        id: problems.id,
        title: problems.title,
        difficulty: problems.difficulty,
        source: problems.source,
        hashtags: problems.hashtags,
        content: problems.content,
        choices: problems.choices,
        correctAnswer: problems.correctAnswer,
        explanation: problems.explanation,
      })
      .from(problems)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .limit(criteria.limit || 5);

    return results;
  } catch (error: any) {
    console.error(`Error searching problems: ${error.message}`);
    throw error;
  }
}
