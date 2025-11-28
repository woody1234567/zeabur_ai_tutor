import { personalEvents } from "~~/db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const body = await readBody(event);

  const { title, start, end, allDay } = body;

  if (!title || !start) {
    throw createError({
      statusCode: 400,
      statusMessage: "Title and start date are required",
    });
  }

  const newEvent = await useDrizzle()
    .insert(personalEvents)
    .values({
      userId: session.user.id,
      title,
      start: new Date(start),
      end: end ? new Date(end) : null,
      allDay: allDay ?? true,
    })
    .returning();

  return newEvent[0];
});
