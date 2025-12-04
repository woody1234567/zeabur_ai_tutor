import { db } from "../../../db";
import { user, roleRequests } from "../../../db/schema";
import { eq, desc, ilike, or, and } from "drizzle-orm";
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
  const search = (query.search as string) || "";
  const role = (query.role as string) || "";

  const conditions = [];

  if (search) {
    const searchLower = `%${search.toLowerCase()}%`;
    conditions.push(
      or(ilike(user.name, searchLower), ilike(user.email, searchLower))
    );
  }

  if (role) {
    conditions.push(eq(user.role, role as any));
  }

  const usersWithRequests = await db
    .select({
      userData: user,
      requestedRole: roleRequests.role,
    })
    .from(user)
    .leftJoin(roleRequests, eq(user.id, roleRequests.userId))
    .where(and(...conditions))
    .orderBy(desc(user.createdAt));

  console.log("Fetched users count:", usersWithRequests.length);
  if (usersWithRequests.length > 0) {
    console.log("First user sample:", usersWithRequests[0]);
  }

  return {
    users: usersWithRequests.map((row) => ({
      ...row.userData,
      requestedRole: row.requestedRole,
    })),
  };
});
