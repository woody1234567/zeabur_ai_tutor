import { posts } from "../../../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const { id: classroomId, postId } = getRouterParams(event);
  const body = await readBody(event);

  if (!classroomId || !postId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID and Post ID are required",
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

  const whereClause =
    session.user.role === "admin"
      ? and(eq(posts.id, postId), eq(posts.classroomId, classroomId))
      : and(eq(posts.id, postId), eq(posts.classroomId, classroomId), eq(posts.teacherId, session.user.id));

  const updatedPost = await useDrizzle()
    .update(posts)
    .set({
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
      updatedAt: new Date(),
    })
    .where(whereClause)
    .returning();

  return updatedPost[0];
});
