import { z } from "zod";
import { db } from "../../../db";
import { roleRequests } from "../../../db/schema";
import { requireAuthSession } from "../../utils/auth";

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
    await db.insert(roleRequests).values({
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
