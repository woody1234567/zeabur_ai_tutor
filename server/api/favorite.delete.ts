import { db } from "../../db";
import { favorites } from "../../db/schema";
import { requireAuthSession } from "../../server/utils/auth";
import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const { problemId } = await readBody(event);

  if (!problemId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing problemId",
    });
  }

  await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, session.user.id),
        eq(favorites.problemId, problemId)
      )
    );

  return { success: true };
});
