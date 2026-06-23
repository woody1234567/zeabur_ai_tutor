import { db } from "../../../../db";
import { errorProblems } from "../../../../db/schema";
// Auto-import auth from server/utils/auth
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { problemId } = body;

  if (!problemId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing problemId",
    });
  }

  // Find the error problem record
  const existingError = await db
    .select()
    .from(errorProblems)
    .where(
      and(
        eq(errorProblems.userId, session.user.id),
        eq(errorProblems.problemId, problemId)
      )
    )
    .limit(1);

  if (existingError.length === 0) {
    // If no record exists, simpler to just insert one as "understood" (assuming user clicked the button)
    // or maybe they clicked "Mark as Understood" so they want it to be true.
    await db.insert(errorProblems).values({
      userId: session.user.id,
      problemId: problemId,
      understood: true,
    });
    return {
      understood: true,
    };
  }

  const errorRecord = existingError[0]!;

  // Toggle understood status
  const currentStatus = errorRecord.understood;
  const newStatus = !currentStatus;

  await db
    .update(errorProblems)
    .set({
      understood: newStatus,
    })
    .where(eq(errorProblems.id, errorRecord.id));

  return {
    understood: newStatus,
  };
});
