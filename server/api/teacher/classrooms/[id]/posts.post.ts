import { db } from "../../../../../server/utils/db";
import { posts } from "../../../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (!session?.user || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const { id: classroomId } = getRouterParams(event);
  const body = await readBody(event);

  if (!classroomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID is required",
    });
  }

  // Basic validation
  if (
    !body.content ||
    !body.classDate ||
    !body.classStartTime ||
    !body.classEndTime
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Content, Date, Start Time, and End Time are required",
    });
  }

  const newPost = await db
    .insert(posts)
    .values({
      classroomId,
      teacherId: session.user.id,
      content: body.content,
      classDate: body.classDate,
      classStartTime: new Date(body.classStartTime),
      classEndTime: new Date(body.classEndTime),
      classLength: `${
        (new Date(body.classEndTime).getTime() -
          new Date(body.classStartTime).getTime()) /
        60000
      } minutes`,
      attendees: body.attendees || [],
    })
    .returning();

  return newPost[0];
});
