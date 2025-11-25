import { classrooms } from "../../../db/schema";
import { auth } from "../../../server/utils/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session || session.user.role !== "teacher") {
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
