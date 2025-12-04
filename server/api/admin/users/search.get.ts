import { db } from "../../../../db";
import { user } from "../../../../db/schema";
import { ilike, or, and, eq } from "drizzle-orm";
import { requireAuthSession } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const query = getQuery(event);
  const search = query.q as string;
  const role = query.role as string;

  if (!search && !role) {
    return [];
  }

  const conditions = [];

  if (search) {
    conditions.push(
      or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
    );
  }

  if (role) {
    conditions.push(eq(user.role, role));
  }

  const results = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
    })
    .from(user)
    .where(and(...conditions))
    .limit(20);

  return results;
});
