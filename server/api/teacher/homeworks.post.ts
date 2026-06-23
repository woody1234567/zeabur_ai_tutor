import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import * as tables from "../../../db/schema";

const createHomeworkSchema = z.object({
  classroomIds: z.array(z.string()), // Changed from classroomId to classroomIds
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
      data: result.error.issues,
    });
  }

  const { classroomIds, subject, title, deadline, problemIds } = result.data;

  // Verify that all classrooms belong to the teacher
  const classrooms = await useDrizzle()
    .select()
    .from(tables.classrooms)
    .where(
      and(
        inArray(tables.classrooms.id, classroomIds),
        eq(tables.classrooms.teacherId, session.user.id)
      )
    );

  if (classrooms.length !== classroomIds.length) {
    throw createError({
      statusCode: 404,
      message: "One or more classrooms not found or access denied",
    });
  }

  try {
    const newHomework = await useDrizzle().transaction(async (tx) => {
      // 1. Create Homework
      // For backward compatibility or primary classroom, we might store the first ID, or leave it null.
      // Since we made it nullable in schema (removed .notNull()), we can skip it or set it to the first one.
      // Let's set it to the first one for now to keep things working if something relies on it,
      // but rely on the new table for real logic.
      const [homework] = await tx
        .insert(tables.homeworks)
        .values({
          classroomId: classroomIds[0],
          teacherId: session.user.id,
          subject,
          title,
          deadline: deadline ? new Date(deadline) : null,
        })
        .returning();

      // 2. Add Classrooms to Homework
      if (classroomIds.length > 0) {
        await tx.insert(tables.homeworkClassrooms).values(
          classroomIds.map((cid) => ({
            homeworkId: homework!.id,
            classroomId: cid,
          }))
        );
      }

      // 3. Add Problems to Homework
      if (problemIds.length > 0) {
        await tx.insert(tables.homeworkProblems).values(
          problemIds.map((problemId, index) => ({
            homeworkId: homework!.id,
            problemId,
            order: String(index),
          }))
        );
      }

      return homework;
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
