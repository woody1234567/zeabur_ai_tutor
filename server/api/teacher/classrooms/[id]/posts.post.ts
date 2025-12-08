import { db } from "../../../../../server/utils/db";
import { posts } from "../../../../../db/schema";

export default defineEventHandler(async (event) => {
  const { id: classroomId } = getRouterParams(event);
  const body = await readBody(event);
  const session = await requireAuthSession(event);

  if (!classroomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID is required",
    });
  }

  // Basic validation
  if (!body.content || !body.classDate) {
    throw createError({
      statusCode: 400,
      statusMessage: "Content and Class Date are required",
    });
  }

  const newPost = await db
    .insert(posts)
    .values({
      classroomId,
      teacherId: session.user.id,
      content: body.content,
      classDate: new Date(body.classDate),
      classLength: body.classLength ? parseInt(body.classLength) : null,
      studentId: body.studentId || null,
    })
    .returning();

  return newPost[0];
});
