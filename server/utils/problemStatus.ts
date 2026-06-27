import { favorites, errorProblems, problemsStatus } from "../../db/schema";
import { sql, and, or, eq } from "drizzle-orm";

export async function updateProblemStatus(userId: string) {
  // Consolidates data from favorites and error_problems and upserts into problems_status
  // is_favorite: true if exists in favorites
  // is_wrong: true if exists in error_problems
  // understood: value from error_problems (default false if not present, but logic handles presence)

  const query = useDrizzle()
    .select({
      id: sql<string>`gen_random_uuid()`.as("id"),
      userId: sql<string>`${userId}`.as("userId"),
      problemId:
        sql<string>`COALESCE(${favorites.problemId}, ${errorProblems.problemId})`.as(
          "problemId"
        ),
      isFavorite:
        sql<boolean>`CASE WHEN ${favorites.problemId} IS NOT NULL THEN true ELSE false END`.as(
          "isFavorite"
        ),
      isWrong:
        sql<boolean>`CASE WHEN ${errorProblems.problemId} IS NOT NULL THEN true ELSE false END`.as(
          "isWrong"
        ),
      understood:
        sql<boolean>`CASE WHEN ${errorProblems.understood} IS NOT NULL THEN ${errorProblems.understood} ELSE false END`.as(
          "understood"
        ),
      updatedAt: sql<Date>`NOW()`.as("updatedAt"),
    })
    .from(favorites)
    .fullJoin(
      errorProblems,
      and(
        eq(favorites.problemId, errorProblems.problemId),
        eq(favorites.userId, errorProblems.userId)
      )
    )
    .where(or(eq(favorites.userId, userId), eq(errorProblems.userId, userId)));

  await useDrizzle()
    .insert(problemsStatus)
    .select(query)
    .onConflictDoUpdate({
      target: [problemsStatus.userId, problemsStatus.problemId],
      set: {
        isFavorite: sql`excluded.is_favorite`,
        isWrong: sql`excluded.is_wrong`,
        understood: sql`excluded.understood`,
        updatedAt: sql`NOW()`,
      },
    });
}
