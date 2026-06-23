import { problems, testbankProblems, testbanks } from "../../../db/schema";
import { and, eq, inArray } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);
  const {
    title,
    content,
    choices,
    correctAnswer,
    explanation,
    difficulty,
    subject,
    chapter,
    grade,
    source,
    imageUrl,
    hashtags,
    testbankIds,
  } = body;

  if (!title || !content || !choices || !correctAnswer) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields",
    });
  }

  const newProblem = await useDrizzle()
    .insert(problems)
    .values({
      title,
      content,
      choices,
      correctAnswer,
      explanation,
      difficulty,
      subject,
      chapter,
      grade,
      source,
      imageUrl,
      hashtags,
      createdBy: session.user.id,
    })
    .returning();

  generateAndStoreEmbedding(newProblem[0]!.id, {
    title, content, explanation, subject, chapter, grade, hashtags,
  });

  // Link to testbanks if provided
  if (Array.isArray(testbankIds) && testbankIds.length > 0) {
    const owned = await useDrizzle()
      .select({ id: testbanks.id })
      .from(testbanks)
      .where(and(eq(testbanks.ownerId, session.user.id), inArray(testbanks.id, testbankIds)));
    if (owned.length !== testbankIds.length) {
      throw createError({ statusCode: 403, statusMessage: "You can only link problems to testbanks you own" });
    }
    await useDrizzle()
      .insert(testbankProblems)
      .values(testbankIds.map((testbankId: string) => ({ testbankId, problemId: newProblem[0]!.id })))
      .onConflictDoNothing();
  }

  return newProblem[0];
});
