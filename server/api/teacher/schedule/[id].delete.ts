import { teacherAvailability } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher") {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Invalid event id" });
  }

  const [existing] = await useDrizzle()
    .select()
    .from(teacherAvailability)
    .where(eq(teacherAvailability.id, id))
    .limit(1);

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Event not found" });
  }

  if (existing.teacherId !== session.user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: "You can only delete your own events",
    });
  }

  await useDrizzle()
    .delete(teacherAvailability)
    .where(eq(teacherAvailability.id, id));

  return { success: true };
});
