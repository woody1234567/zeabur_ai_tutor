import { db } from "../../db";
import { favorites } from "../../db/schema";
import { requireAuthSession } from "../../server/utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const { problemId } = await readBody(event);

  if (!problemId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing problemId",
    });
  }

  await db.insert(favorites).values({
    userId: session.user.id,
    problemId: problemId,
  });

  return { success: true };
});
