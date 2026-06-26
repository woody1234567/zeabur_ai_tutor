import { defineEventHandler, readBody } from "h3";
import { db } from "../../../db";
import { pendingParent } from "../../../db/schema";
import { requireAuthSession } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "parent") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody(event);
  const { studentName, studentEmail } = body;

  if (!studentName || !studentEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields",
    });
  }

  // Check if request already exists
  const existingRequest = await db.query.pendingParent.findFirst({
    where: (pendingParent, { eq, and }) =>
      and(
        eq(pendingParent.parentId, session.user.id),
        eq(pendingParent.status, "pending")
      ),
  });

  if (existingRequest) {
    throw createError({
      statusCode: 400,
      statusMessage: "Pending request already exists",
    });
  }

  await db.insert(pendingParent).values({
    parentId: session.user.id,
    studentName,
    studentEmail,
  });

  return { success: true };
});
