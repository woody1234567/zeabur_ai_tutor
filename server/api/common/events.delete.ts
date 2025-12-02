import { personalEvents } from "~~/db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const query = getQuery(event);
  const id = query.id as string;

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event ID is required",
    });
  }

  // Ensure the event belongs to the user
  const deletedEvent = await useDrizzle()
    .delete(personalEvents)
    .where(
      and(eq(personalEvents.id, id), eq(personalEvents.userId, session.user.id))
    )
    .returning();

  if (deletedEvent.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found or unauthorized",
    });
  }

  return { success: true };
});
