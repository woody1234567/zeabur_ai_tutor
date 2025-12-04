import { eq, or, ilike, and } from "drizzle-orm";
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
  const search = query.search as string;

  const conditions = [];

  if (id) {
    conditions.push(eq(pendingParent.id, id));
  }

  if (search) {
    const searchLower = `%${search.toLowerCase()}%`;
    conditions.push(
      or(
        ilike(pendingParent.studentName, searchLower),
        ilike(pendingParent.studentEmail, searchLower),
        ilike(pendingParent.status, searchLower),
        ilike(user.name, searchLower),
        ilike(user.email, searchLower)
      )
    );
  }

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

  if (conditions.length > 0) {
    // @ts-ignore
    queryBuilder.where(and(...conditions));
  }

  const results = await queryBuilder;

  return results;
});
