import { problems } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateProblemSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  choices: z.record(z.string(), z.string()),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  subject: z.string().optional(),
  chapter: z.string().optional(),
  grade: z.string().optional(),
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

  // Verify ownership (admins can update any problem)
  if (session.user.role !== "admin") {
    const [problem] = await useDrizzle()
      .select({ createdBy: problems.createdBy })
      .from(problems)
      .where(eq(problems.id, id))
      .limit(1);

    if (!problem) {
      throw createError({
        statusCode: 404,
        statusMessage: "Problem not found",
      });
    }

    if (problem.createdBy !== session.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "You can only update problems you created",
      });
    }
  }

  const body = await readBody(event);
  const validation = updateProblemSchema.safeParse(body);

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Validation failed",
      data: validation.error.issues,
    });
  }

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
        subject,
        chapter,
        grade,
        source,
        imageUrl,
        hashtags,
        updatedAt: new Date(),
      })
      .where(eq(problems.id, id));

    generateAndStoreEmbedding(id, {
      title, content, explanation, subject, chapter, grade, hashtags,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating problem:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update problem",
    });
  }
});
