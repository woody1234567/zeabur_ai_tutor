import { db } from "../../db";
import {
  chatProjects,
  chatHistory,
  teacherChatHistory,
} from "../../db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

const MAX_SYSTEM_PROMPT_LENGTH = 2000;

function getChatTable(role: string) {
  return role === "teacher" ? teacherChatHistory : chatHistory;
}

function getOwnerColumn(role: string) {
  return role === "teacher"
    ? teacherChatHistory.teacherId
    : chatHistory.studentId;
}

export async function listProjects(userId: string, role: string) {
  return db
    .select()
    .from(chatProjects)
    .where(
      and(eq(chatProjects.userId, userId), eq(chatProjects.role, role))
    )
    .orderBy(desc(chatProjects.updatedAt));
}

export async function createProject(
  userId: string,
  role: string,
  data: { name: string; description?: string; systemPrompt?: string }
) {
  if (!data.name?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project name is required",
    });
  }
  if (
    data.systemPrompt &&
    data.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: `System prompt must be under ${MAX_SYSTEM_PROMPT_LENGTH} characters`,
    });
  }

  const [project] = await db
    .insert(chatProjects)
    .values({
      userId,
      role,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      systemPrompt: data.systemPrompt?.trim() || null,
    })
    .returning();

  return project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  role: string,
  data: { name?: string; description?: string; systemPrompt?: string | null }
) {
  if (data.name !== undefined && !data.name.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project name cannot be empty",
    });
  }
  if (
    data.systemPrompt &&
    data.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: `System prompt must be under ${MAX_SYSTEM_PROMPT_LENGTH} characters`,
    });
  }

  const existing = await db.query.chatProjects.findFirst({
    where: and(
      eq(chatProjects.id, projectId),
      eq(chatProjects.userId, userId),
      eq(chatProjects.role, role)
    ),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.description !== undefined)
    updates.description = data.description?.trim() || null;
  if (data.systemPrompt !== undefined)
    updates.systemPrompt = data.systemPrompt?.trim() || null;

  const [updated] = await db
    .update(chatProjects)
    .set(updates)
    .where(eq(chatProjects.id, projectId))
    .returning();

  return updated;
}

export async function deleteProject(
  projectId: string,
  userId: string,
  role: string
) {
  const existing = await db.query.chatProjects.findFirst({
    where: and(
      eq(chatProjects.id, projectId),
      eq(chatProjects.userId, userId),
      eq(chatProjects.role, role)
    ),
  });
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" });
  }

  await db.delete(chatProjects).where(eq(chatProjects.id, projectId));
  return { success: true };
}

export async function moveChatToProject(
  chatId: string,
  projectId: string | null,
  userId: string,
  role: string
) {
  const table = getChatTable(role);
  const ownerCol = getOwnerColumn(role);

  const queryTable = role === "teacher" ? db.query.teacherChatHistory : db.query.chatHistory;
  const chat = await queryTable.findFirst({
    where: and(eq(table.id, chatId), eq(ownerCol, userId)),
  });
  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: "Chat not found" });
  }

  if (projectId) {
    const project = await db.query.chatProjects.findFirst({
      where: and(
        eq(chatProjects.id, projectId),
        eq(chatProjects.userId, userId),
        eq(chatProjects.role, role)
      ),
    });
    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: "Project not found",
      });
    }
  }

  await db
    .update(table)
    .set({ projectId: projectId ?? null })
    .where(eq(table.id, chatId));

  return { success: true };
}

export async function listChats(
  userId: string,
  role: string,
  filters?: { projectId?: string; unorganized?: boolean }
) {
  const table = getChatTable(role);
  const ownerCol = getOwnerColumn(role);

  const conditions = [eq(ownerCol, userId)];

  if (filters?.unorganized) {
    conditions.push(isNull(table.projectId));
  } else if (filters?.projectId) {
    conditions.push(eq(table.projectId, filters.projectId));
  }

  return db
    .select({
      id: table.id,
      title: table.title,
      projectId: table.projectId,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    })
    .from(table)
    .where(and(...conditions))
    .orderBy(desc(table.updatedAt));
}
