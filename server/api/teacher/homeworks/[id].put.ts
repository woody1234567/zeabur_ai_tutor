import { homeworks, homeworkClassrooms } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  if (session.user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const homeworkId = event.context.params?.id;
  if (!homeworkId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Homework ID is required",
    });
  }

  const body = await readBody(event);
  const { title, subject, deadline, classroomIds } = body;

  if (!title || !classroomIds || !Array.isArray(classroomIds)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Title and Classroom IDs (array) are required",
    });
  }

  try {
    const updatedHomework = await useDrizzle().transaction(async (tx) => {
      // Verify ownership and update homework basic details
      const [result] = await tx
        .update(homeworks)
        .set({
          title,
          subject,
          deadline: deadline ? new Date(deadline) : null,
          classroomId: classroomIds[0] || null, // Update legacy column
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(homeworks.id, homeworkId),
            eq(homeworks.teacherId, session.user.id)
          )
        )
        .returning();

      if (!result) {
        throw createError({
          statusCode: 404,
          statusMessage: "Homework not found or unauthorized",
        });
      }

      // Update Classroom Assignments
      // 1. Delete existing assignments
      await tx
        .delete(homeworkClassrooms)
        .where(eq(homeworkClassrooms.homeworkId, homeworkId));

      // 2. Insert new assignments
      if (classroomIds.length > 0) {
        await tx.insert(homeworkClassrooms).values(
          classroomIds.map((cid: string) => ({
            homeworkId: homeworkId,
            classroomId: cid,
          }))
        );
      }

      return result;
    });

    return { success: true, homework: updatedHomework };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to update homework",
    });
  }
});
