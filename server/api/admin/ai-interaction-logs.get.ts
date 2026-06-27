import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { aiInteractionLogs, user } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const query = getQuery(event);
  const search = typeof query.search === "string" ? query.search.trim() : "";
  const eventType = typeof query.eventType === "string" ? query.eventType : "";
  const toolName = typeof query.toolName === "string" ? query.toolName : "";
  const userRole = typeof query.userRole === "string" ? query.userRole : "";
  const status = typeof query.status === "string" ? query.status : "";
  const chatId = typeof query.chatId === "string" ? query.chatId.trim() : "";
  const dateFrom = typeof query.dateFrom === "string" ? query.dateFrom : "";
  const dateTo = typeof query.dateTo === "string" ? query.dateTo : "";
  const limit = Math.min(Math.max(Number.parseInt(String(query.limit)) || 50, 1), 200);
  const offset = Math.max(Number.parseInt(String(query.offset)) || 0, 0);

  const conditions = [];

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(aiInteractionLogs.content, pattern),
        ilike(aiInteractionLogs.error, pattern),
        ilike(aiInteractionLogs.toolName, pattern),
        ilike(aiInteractionLogs.chatId, pattern),
      ),
    );
  }
  if (eventType) conditions.push(eq(aiInteractionLogs.eventType, eventType));
  if (toolName) conditions.push(eq(aiInteractionLogs.toolName, toolName));
  if (userRole) conditions.push(eq(aiInteractionLogs.userRole, userRole));
  if (status) conditions.push(eq(aiInteractionLogs.status, status));
  if (chatId) conditions.push(eq(aiInteractionLogs.chatId, chatId));
  if (dateFrom) conditions.push(gte(aiInteractionLogs.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(aiInteractionLogs.createdAt, new Date(dateTo)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, countResult] = await Promise.all([
    useDrizzle()
      .select({
        id: aiInteractionLogs.id,
        eventKey: aiInteractionLogs.eventKey,
        chatId: aiInteractionLogs.chatId,
        messageId: aiInteractionLogs.messageId,
        toolCallId: aiInteractionLogs.toolCallId,
        userId: aiInteractionLogs.userId,
        userName: user.name,
        userRole: aiInteractionLogs.userRole,
        eventType: aiInteractionLogs.eventType,
        status: aiInteractionLogs.status,
        content: aiInteractionLogs.content,
        attachments: aiInteractionLogs.attachments,
        toolName: aiInteractionLogs.toolName,
        toolInput: aiInteractionLogs.toolInput,
        toolOutput: aiInteractionLogs.toolOutput,
        finishReason: aiInteractionLogs.finishReason,
        durationMs: aiInteractionLogs.durationMs,
        error: aiInteractionLogs.error,
        classroomId: aiInteractionLogs.classroomId,
        projectId: aiInteractionLogs.projectId,
        stepNumber: aiInteractionLogs.stepNumber,
        modelId: aiInteractionLogs.modelId,
        createdAt: aiInteractionLogs.createdAt,
        updatedAt: aiInteractionLogs.updatedAt,
      })
      .from(aiInteractionLogs)
      .leftJoin(user, eq(aiInteractionLogs.userId, user.id))
      .where(whereClause)
      .orderBy(desc(aiInteractionLogs.createdAt))
      .limit(limit)
      .offset(offset),
    useDrizzle()
      .select({ count: sql<number>`count(*)::int` })
      .from(aiInteractionLogs)
      .where(whereClause),
  ]);

  return {
    logs,
    total: countResult[0]?.count ?? 0,
    limit,
    offset,
  };
});
