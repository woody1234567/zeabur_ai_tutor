import { problems } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateProblemSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  choices: z.array(z.string()).min(2),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  source: z.string().optional(),
  imageUrl: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
});

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing problem ID",
    });
  }

  const body = await readBody(event);
  const validation = updateProblemSchema.safeParse(body);

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: validation.error.errors,
    });
  }

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
  } = validation.data;

  try {
    await useDrizzle()
      .update(problems)
      .set({
        title,
        content,
        choices,
        correctAnswer,
        explanation,
        difficulty,
        source,
        imageUrl,
        hashtags,
        updatedAt: new Date(),
      })
      .where(eq(problems.id, id));

    return { success: true };
  } catch (error: any) {
    console.error("Error updating problem:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update problem",
    });
  }
});
