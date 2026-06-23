import { db } from "../../db";
import { problems } from "../../db/schema";
import { and, or, eq, ilike, sql, cosineDistance, isNotNull } from "drizzle-orm";
import { generateEmbedding } from "./embedding";

export type SearchProblemsCriteria = {
  query?: string;
  title?: string;
  source?: string;
  hashtag?: string;
  subject?: string;
  chapter?: string;
  grade?: string;
  difficulty?: string;
  testbankId?: string;
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
  if (criteria.subject) {
    filters.push(eq(problems.subject, criteria.subject));
  }
  if (criteria.chapter) {
    filters.push(ilike(problems.chapter, `%${criteria.chapter}%`));
  }
  if (criteria.grade) {
    filters.push(eq(problems.grade, criteria.grade));
  }
  if (criteria.difficulty) {
    filters.push(eq(problems.difficulty, criteria.difficulty));
  }
  if (criteria.testbankId) {
    filters.push(
      sql`${problems.id} IN (SELECT problem_id FROM testbank_problems WHERE testbank_id = ${criteria.testbankId})`
    );
  }

  try {
    if (criteria.query) {
      const queryEmbedding = await generateEmbedding(criteria.query);
      const distance = cosineDistance(problems.embedding, queryEmbedding);

      filters.push(isNotNull(problems.embedding));

      const results = await db
        .select({
          id: problems.id,
          title: problems.title,
          difficulty: problems.difficulty,
          subject: problems.subject,
          chapter: problems.chapter,
          grade: problems.grade,
          source: problems.source,
          hashtags: problems.hashtags,
          content: problems.content,
          choices: problems.choices,
          correctAnswer: problems.correctAnswer,
          explanation: problems.explanation,
          similarity: sql<number>`1 - (${distance})`,
        })
        .from(problems)
        .where(filters.length > 0 ? and(...filters) : undefined)
        .orderBy(distance)
        .limit(criteria.limit || 5);

      return results;
    }

    const results = await db
      .select({
        id: problems.id,
        title: problems.title,
        difficulty: problems.difficulty,
        subject: problems.subject,
        chapter: problems.chapter,
        grade: problems.grade,
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
