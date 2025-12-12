import { eq, and } from "drizzle-orm";
import { postsTemplate } from "../../../../../../db/schema";
import { db } from "../../../../../../server/utils/db";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (!session || !session.user || session.user.role !== "teacher") {
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

  const template = await db.query.postsTemplate.findFirst({
    where: and(
      eq(postsTemplate.classroomId, classroomId),
      eq(postsTemplate.userId, session.user.id)
    ),
  });

  return {
    template: template?.template || null,
  };
});
