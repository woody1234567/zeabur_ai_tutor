import { problems } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing problem ID",
    });
  }

  const result = await useDrizzle()
    .select()
    .from(problems)
    .where(eq(problems.id, id))
    .limit(1);

  if (!result.length) {
    throw createError({
      statusCode: 404,
      statusMessage: "Problem not found",
    });
  }

  return result[0];
});
