import { eq, desc, and } from "drizzle-orm";
import { db } from "../../../../../server/utils/db";
import { posts, user } from "../../../../../db/schema";

export default defineEventHandler(async (event) => {
  const { id: classroomId } = getRouterParams(event);

  // Validate teacher access (optional but recommended)
  // const session = await requireUserSession(event);
  // if (session.user.role !== "teacher") {
  //   throw createError({
  //     statusCode: 403,
  //     statusMessage: "Forbidden",
  //   });
  // }

  if (!classroomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID is required",
    });
  }

  const postsList = await db
    .select({
      id: posts.id,
      content: posts.content,
      classDate: posts.classDate,
      classLength: posts.classLength,
      createdAt: posts.createdAt,
      studentName: user.name,
      studentId: posts.studentId,
    })
    .from(posts)
    .leftJoin(user, eq(posts.studentId, user.id))
    .where(eq(posts.classroomId, classroomId))
    .orderBy(desc(posts.createdAt));

  return postsList;
});
