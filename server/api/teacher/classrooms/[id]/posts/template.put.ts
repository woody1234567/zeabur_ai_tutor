import { eq, and } from "drizzle-orm";
import { postsTemplate } from "../../../../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher") {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const { id: classroomId } = getRouterParams(event);
  if (!classroomId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID is required",
    });
  }

  const body = await readBody(event);
  const { template } = body;

  if (typeof template !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Template content is required",
    });
  }

  // Check if template exists
  const existing = await useDrizzle().query.postsTemplate.findFirst({
    where: and(
      eq(postsTemplate.classroomId, classroomId),
      eq(postsTemplate.userId, session.user.id)
    ),
  });

  if (existing) {
    await useDrizzle()
      .update(postsTemplate)
      .set({
        template,
        updatedAt: new Date(),
      })
      .where(eq(postsTemplate.id, existing.id));
  } else {
    await useDrizzle().insert(postsTemplate).values({
      userId: session.user.id,
      classroomId,
      template,
    });
  }

  return { success: true };
});
