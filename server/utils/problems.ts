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
  viewerId?: string;
  viewerRole?: string;
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

  // Visibility: when a non-admin viewer is provided, restrict to problems they may see.
  if (criteria.viewerRole && criteria.viewerRole !== "admin") {
    if (criteria.viewerRole === "teacher") {
      filters.push(
        sql`EXISTS (
          SELECT 1 FROM testbank_problems tp
          JOIN testbanks tb ON tb.id = tp.testbank_id
          WHERE tp.problem_id = ${problems.id}
          AND (tb.is_public = true OR tb.owner_id = ${criteria.viewerId})
        )`
      );
    } else {
      filters.push(
        sql`EXISTS (
          SELECT 1 FROM testbank_problems tp
          JOIN testbanks tb ON tb.id = tp.testbank_id
          WHERE tp.problem_id = ${problems.id}
          AND (
            tb.is_public = true
            OR tb.id IN (
              SELECT tc.testbank_id FROM testbank_classrooms tc
              WHERE tc.classroom_id IN (
                SELECT cs.classroom_id FROM classroom_students cs
                WHERE cs.student_id = ${criteria.viewerId}
              )
            )
          )
        )`
      );
    }
  }

  try {
    if (criteria.query) {
      const queryEmbedding = await generateEmbedding(criteria.query);
      const distance = cosineDistance(problems.embedding, queryEmbedding);

      filters.push(isNotNull(problems.embedding));

      const results = await useDrizzle()
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

    const results = await useDrizzle()
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
