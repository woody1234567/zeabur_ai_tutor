import { eq, and } from "drizzle-orm";
import {
  classrooms,
  classMaterials,
  classroomMaterials,
} from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const body = await readBody(event);
  const { classroomId, materialId } = body;

  if (!classroomId || !materialId) {
    throw createError({
      statusCode: 400,
      message: "Missing classroomId or materialId",
    });
  }

  // Verify ownership of classroom
  const [classroom] = await useDrizzle()
    .select()
    .from(classrooms)
    .where(
      and(
        eq(classrooms.id, classroomId),
        eq(classrooms.teacherId, session.user.id)
      )
    );

  if (!classroom) {
    throw createError({
      statusCode: 403,
      message: "Unauthorized or classroom not found",
    });
  }

  // Verify ownership of material
  const [material] = await useDrizzle()
    .select()
    .from(classMaterials)
    .where(
      and(
        eq(classMaterials.id, materialId),
        eq(classMaterials.teacherId, session.user.id)
      )
    );

  if (!material) {
    throw createError({
      statusCode: 403,
      message: "Unauthorized or material not found",
    });
  }

  // Check if already shared
  const [existing] = await useDrizzle()
    .select()
    .from(classroomMaterials)
    .where(
      and(
        eq(classroomMaterials.classroomId, classroomId),
        eq(classroomMaterials.materialId, materialId)
      )
    );

  if (existing) {
    return { success: true, message: "Already shared" };
  }

  // Create share record
  await useDrizzle().insert(classroomMaterials).values({
    classroomId,
    materialId,
  });

  return { success: true };
});
