import { z } from "zod";
import { and, eq } from "drizzle-orm";
import * as tables from "../../../db/schema";

const createHomeworkSchema = z.object({
  classroomId: z.string(),
  subject: z.string().optional(),
  title: z.string().optional(),
  deadline: z.string().optional(), // Receive as string, convert to Date
  problemIds: z.array(z.string()),
});

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      message: "Only teachers can create homework",
    });
  }

  const body = await readBody(event);
  const result = createHomeworkSchema.safeParse(body);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Invalid input",
      data: result.error.errors,
    });
  }

  const { classroomId, subject, title, deadline, problemIds } = result.data;

  // Verify that the classroom belongs to the teacher
  const [classroom] = await useDrizzle()
    .select()
    .from(tables.classrooms)
    .where(
      and(
        eq(tables.classrooms.id, classroomId),
        eq(tables.classrooms.teacherId, session.user.id)
      )
    );

  if (!classroom) {
    throw createError({
      statusCode: 404,
      message: "Classroom not found or access denied",
    });
  }

  try {
    const newHomework = await useDrizzle().transaction(async (tx) => {
      // 1. Create Homework
      const [homework] = await tx
        .insert(tables.homeworks)
        .values({
          classroomId,
          teacherId: session.user.id,
          subject,
          title,
          deadline: deadline ? new Date(deadline) : null,
        })
        .returning();

      // 2. Add Problems to Homework
      await tx.insert(tables.homeworkProblems).values(
        problemIds.map((problemId, index) => ({
          homeworkId: homework.id,
          problemId,
          order: String(index), // Store order as string since schema defines it as text
        }))
      );
    });

    return newHomework;
  } catch (error) {
    console.error("Failed to create homework:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to create homework",
    });
  }
});
