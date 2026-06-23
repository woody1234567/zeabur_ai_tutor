import { db } from "../../../db";
import { user } from "../../../db/schema";
import { sql } from "drizzle-orm";

export default defineEventHandler(async () => {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user);
  return { hasUsers: result[0]!.count > 0 };
});
