import { eq, and } from "drizzle-orm";
import { classrooms } from "~~/db/schema";
import { auth } from "~~/server/utils/auth";
import { useDrizzle } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session || session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      message: "Unauthorized",
    });
  }

  const userId = session.user.id;
  const classroomId = getRouterParam(event, "id");
  const body = await readBody(event);

  if (!classroomId) {
    throw createError({
      statusCode: 400,
      message: "Classroom ID is required",
    });
  }

  const { name, description } = body;

  if (!name) {
    throw createError({
      statusCode: 400,
      message: "Classroom name is required",
    });
  }

  // Verify ownership and update
  const [updatedClassroom] = await useDrizzle()
    .update(classrooms)
    .set({
      name,
      description,
      updatedAt: new Date(),
    })
    .where(
      and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, userId))
    )
    .returning();

  if (!updatedClassroom) {
    throw createError({
      statusCode: 404,
      message: "Classroom not found or you don't have permission to edit it",
    });
  }

  return updatedClassroom;
});
