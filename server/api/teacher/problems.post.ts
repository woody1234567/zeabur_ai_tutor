import { problems } from "../../../db/schema";

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
    source,
    imageUrl,
    hashtags,
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
      source,
      imageUrl,
      hashtags,
    })
    .returning();

  return newProblem[0];
});
