import { personalEvents } from "~~/db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const body = await readBody(event);

  const { id, start, end, allDay } = body;

  if (!id || !start) {
    throw createError({
      statusCode: 400,
      statusMessage: "Event ID and start date are required",
    });
  }

  // Update the event, ensuring it belongs to the current user
  const updatedEvent = await useDrizzle()
    .update(personalEvents)
    .set({
      start: new Date(start),
      end: end ? new Date(end) : null,
      allDay: allDay,
      updatedAt: new Date(),
    })
    .where(
      and(eq(personalEvents.id, id), eq(personalEvents.userId, session.user.id))
    )
    .returning();

  if (updatedEvent.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Event not found or unauthorized",
    });
  }

  return updatedEvent[0];
});
