import { posts, classrooms } from "../../../../../db/schema";
import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
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

  // Verify the classroom belongs to the requesting teacher (admins bypass this)
  if (session.user.role !== "admin") {
    const classroom = await useDrizzle().query.classrooms.findFirst({
      where: and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, session.user.id)),
    });
    if (!classroom) {
      throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }
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

  const newPost = await useDrizzle()
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
