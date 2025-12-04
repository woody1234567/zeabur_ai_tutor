import { eq } from "drizzle-orm";
import { pendingParent, user } from "../../../db/schema";
import { db } from "../../../db";
import { requireAuthSession } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const query = getQuery(event);
  const id = query.id as string;

  let queryBuilder = db
    .select({
      id: pendingParent.id,
      parentId: pendingParent.parentId,
      studentName: pendingParent.studentName,
      studentEmail: pendingParent.studentEmail,
      status: pendingParent.status,
      createdAt: pendingParent.createdAt,
      parentName: user.name,
      parentEmail: user.email,
    })
    .from(pendingParent)
    .leftJoin(user, eq(pendingParent.parentId, user.id));

  if (id) {
    // @ts-ignore
    queryBuilder.where(eq(pendingParent.id, id));
  }

  const results = await queryBuilder;

  return results;
});
