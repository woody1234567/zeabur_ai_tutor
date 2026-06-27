import { posts } from "../../../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const { id: classroomId, postId } = getRouterParams(event);
  await requireAuthSession(event);

  if (!classroomId || !postId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Classroom ID and Post ID are required",
    });
  }

  const post = await useDrizzle().query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.classroomId, classroomId)),
  });

  if (!post) {
    throw createError({
      statusCode: 404,
      statusMessage: "Post not found",
    });
  }

  return post;
});
