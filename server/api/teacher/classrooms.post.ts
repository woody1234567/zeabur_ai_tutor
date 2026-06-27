import { classrooms } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const { name, description } = body;

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom name is required",
    });
  }

  const newClassroom = await useDrizzle()
    .insert(classrooms)
    .values({
      name,
      description,
      teacherId: session.user.id,
    })
    .returning();

  return newClassroom[0];
});
