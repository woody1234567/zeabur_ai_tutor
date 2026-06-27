import { eq } from "drizzle-orm";
import { pendingParent } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const body = await readBody(event);
  const { id, status } = body;

  if (!id || !status) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing id or status",
    });
  }

  await useDrizzle()
    .update(pendingParent)
    .set({ status })
    .where(eq(pendingParent.id, id));

  return { success: true };
});
