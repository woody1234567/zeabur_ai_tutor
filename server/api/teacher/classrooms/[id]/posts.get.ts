import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../../../../../server/utils/db";
import { posts } from "../../../../../db/schema";

export default defineEventHandler(async (event) => {
  const { id: classroomId } = getRouterParams(event);

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
      classStartTime: sql<string>`to_char(${posts.classStartTime} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Taipei', 'HH24:MI')`,
      classEndTime: sql<string>`to_char(${posts.classEndTime} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Taipei', 'HH24:MI')`,
      classLength:
        sql<number>`EXTRACT(EPOCH FROM ${posts.classLength}) / 60`.mapWith(
          Number
        ),
      createdAt: posts.createdAt,
      attendees: posts.attendees,
    })
    .from(posts)
    .where(eq(posts.classroomId, classroomId))
    .orderBy(desc(posts.createdAt));

  return postsList;
});
