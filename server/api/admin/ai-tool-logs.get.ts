import { db } from "../../../db";
import { aiToolLogs, user } from "../../../db/schema";
import { eq, desc, ilike, and, gte, lte, sql, isNotNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const query = getQuery(event);
  const toolName = query.toolName as string | undefined;
  const search = query.search as string | undefined;
  const userRole = query.userRole as string | undefined;
  const dateFrom = query.dateFrom as string | undefined;
  const dateTo = query.dateTo as string | undefined;
  const hasError = query.hasError as string | undefined;
  const limit = Math.min(parseInt(query.limit as string) || 50, 200);
  const offset = parseInt(query.offset as string) || 0;

  const conditions = [];

  if (toolName) {
    conditions.push(eq(aiToolLogs.toolName, toolName));
  }
  if (search) {
    conditions.push(ilike(aiToolLogs.userMessage, `%${search}%`));
  }
  if (userRole) {
    conditions.push(eq(aiToolLogs.userRole, userRole));
  }
  if (dateFrom) {
    conditions.push(gte(aiToolLogs.createdAt, new Date(dateFrom)));
  }
  if (dateTo) {
    conditions.push(lte(aiToolLogs.createdAt, new Date(dateTo)));
  }
  if (hasError === "true") {
    conditions.push(isNotNull(aiToolLogs.error));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, countResult] = await Promise.all([
    db
      .select({
        id: aiToolLogs.id,
        userId: aiToolLogs.userId,
        userName: user.name,
        userRole: aiToolLogs.userRole,
        toolName: aiToolLogs.toolName,
        userMessage: aiToolLogs.userMessage,
        args: aiToolLogs.args,
        resultSummary: aiToolLogs.resultSummary,
        resultCount: aiToolLogs.resultCount,
        durationMs: aiToolLogs.durationMs,
        error: aiToolLogs.error,
        createdAt: aiToolLogs.createdAt,
      })
      .from(aiToolLogs)
      .leftJoin(user, eq(aiToolLogs.userId, user.id))
      .where(whereClause)
      .orderBy(desc(aiToolLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiToolLogs)
      .where(whereClause),
  ]);

  return {
    logs,
    total: countResult[0]?.count ?? 0,
    limit,
    offset,
  };
});
