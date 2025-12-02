import { eq, and } from "drizzle-orm";
import { classrooms } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const { user } = session;

  if (user.role !== "teacher") {
    throw createError({
      statusCode: 403,
      message: "Only teachers can access this endpoint",
    });
  }

  const classroomId = getRouterParam(event, "id");
  if (!classroomId) {
    throw createError({
      statusCode: 400,
      message: "Classroom ID is required",
    });
  }

  try {
    // Check if the classroom exists and belongs to the teacher
    const [existingClassroom] = await useDrizzle()
      .select()
      .from(classrooms)
      .where(
        and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, user.id))
      );

    if (!existingClassroom) {
      throw createError({
        statusCode: 404,
        message:
          "Classroom not found or you do not have permission to delete it",
      });
    }

    // Delete the classroom
    await useDrizzle().delete(classrooms).where(eq(classrooms.id, classroomId));

    return {
      message: "Classroom deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting classroom:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to delete classroom",
    });
  }
});
