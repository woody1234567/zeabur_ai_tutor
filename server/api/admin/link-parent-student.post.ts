import { eq, and } from "drizzle-orm";
import { pendingParent, parentStudents } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const body = await readBody(event);
  const { pendingParentId, studentId } = body;

  if (!pendingParentId || !studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing pendingParentId or studentId",
    });
  }

  try {
    await useDrizzle().transaction(async (tx) => {
      // 1. Get parentId from pending_parent
      const [pendingRecord] = await tx
        .select()
        .from(pendingParent)
        .where(eq(pendingParent.id, pendingParentId))
        .limit(1);

      if (!pendingRecord) {
        throw new Error("Pending parent record not found");
      }

      // 2. Guard against duplicate links
      const [existing] = await tx
        .select()
        .from(parentStudents)
        .where(
          and(
            eq(parentStudents.parentId, pendingRecord.parentId),
            eq(parentStudents.studentId, studentId)
          )
        )
        .limit(1);

      if (existing) {
        throw new Error("This parent-student link already exists");
      }

      // 3. Insert into parent_students
      await tx.insert(parentStudents).values({
        parentId: pendingRecord.parentId,
        studentId: studentId,
      });

      // 3. Update pending_parent status
      await tx
        .update(pendingParent)
        .set({ status: "linked" })
        .where(eq(pendingParent.id, pendingParentId));
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to link student and parent:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Internal Server Error",
    });
  }
});
