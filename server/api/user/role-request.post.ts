import { z } from "zod";
import { roleRequests } from "../../../db/schema";

const roleRequestSchema = z.object({
  role: z.enum(["teacher", "student", "parent"]),
});

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const body = await readBody(event);
  const result = roleRequestSchema.safeParse(body);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid role",
    });
  }

  const { role } = result.data;

  try {
    const existingRequest = await useDrizzle().query.roleRequests.findFirst({
      where: (roleRequests, { eq }) => eq(roleRequests.userId, session.user.id),
    });

    if (existingRequest) {
      return { success: true };
    }

    await useDrizzle().insert(roleRequests).values({
      userId: session.user.id,
      role,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to save role request", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to save role request",
    });
  }
});
