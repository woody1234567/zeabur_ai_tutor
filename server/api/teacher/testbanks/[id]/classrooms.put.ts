import { testbanks, testbankClassrooms } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing testbank ID" });
  }

  // Verify ownership
  const [tb] = await useDrizzle()
    .select({ id: testbanks.id })
    .from(testbanks)
    .where(and(eq(testbanks.id, id), eq(testbanks.ownerId, session.user.id)))
    .limit(1);

  if (!tb) {
    throw createError({ statusCode: 404, statusMessage: "Testbank not found or not owned by you" });
  }

  const { classroomIds } = await readBody(event);
  if (!Array.isArray(classroomIds)) {
    throw createError({ statusCode: 400, statusMessage: "classroomIds array is required" });
  }

  // Replace: delete all existing, then insert new
  await useDrizzle()
    .delete(testbankClassrooms)
    .where(eq(testbankClassrooms.testbankId, id));

  if (classroomIds.length > 0) {
    await useDrizzle()
      .insert(testbankClassrooms)
      .values(classroomIds.map((classroomId: string) => ({ testbankId: id, classroomId })));
  }

  return { success: true };
});
