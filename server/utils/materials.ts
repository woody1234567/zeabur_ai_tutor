import {
  classMaterials,
  classroomMaterials,
  classroomStudents,
  classrooms,
} from "../../db/schema";
import { and, eq, ilike, or, desc, inArray, sql, type SQL } from "drizzle-orm";

export const recommendMaterials = async (args: {
  studentId: string;
  keyword?: string;
  limit?: number;
}) => {
  // 1. Find all classrooms the student is enrolled in
  const enrolledClassrooms = await useDrizzle()
    .select({ id: classroomStudents.classroomId })
    .from(classroomStudents)
    .where(eq(classroomStudents.studentId, args.studentId));

  if (enrolledClassrooms.length === 0) {
    return [];
  }

  const classroomIds = enrolledClassrooms.map((c) => c.id);

  // 2. Find materials shared with these classrooms
  // We join classroom_materials -> class_materials
  // And filter by keyword if provided
  let whereClause: SQL | undefined = inArray(
    classroomMaterials.classroomId,
    classroomIds
  );

  if (args.keyword) {
    const keyword = `%${args.keyword}%`;
    const keywordCondition = or(
      ilike(classMaterials.name, keyword),
      ilike(classMaterials.subject, keyword),
      sql`exists (select 1 from jsonb_array_elements_text(${classMaterials.hashtags}) as t(tag) where t.tag ilike ${keyword})`
    );
    whereClause = and(whereClause, keywordCondition);
  }

  const materials = await useDrizzle()
    .select({
      id: classMaterials.id,
      name: classMaterials.name,
      type: classMaterials.type,
      url: classMaterials.url,
      subject: classMaterials.subject,
      description: classMaterials.subject, // Using subject as description proxy if needed
      className: classrooms.name,
      classroomId: classrooms.id,
      isFolder: classMaterials.isFolder,
      sharedAt: classroomMaterials.createdAt,
    })
    .from(classroomMaterials)
    .innerJoin(
      classMaterials,
      eq(classroomMaterials.materialId, classMaterials.id)
    )
    .innerJoin(classrooms, eq(classroomMaterials.classroomId, classrooms.id))
    .where(whereClause)
    .orderBy(desc(classroomMaterials.createdAt))
    .limit(args.limit || 5);

  return materials;
};

export const getClassMaterialsMetadata = async (args: {
  studentId?: string;
  teacherId?: string;
  limit?: number;
}) => {
  const limit = Math.min(Math.max(args.limit ?? 100, 1), 100);

  if (args.studentId && args.teacherId) {
    throw new Error("Only one material access scope can be selected");
  }

  if (args.studentId) {
    const enrolledClassrooms = await useDrizzle()
      .select({ id: classroomStudents.classroomId })
      .from(classroomStudents)
      .where(eq(classroomStudents.studentId, args.studentId));

    if (enrolledClassrooms.length === 0) {
      return [];
    }

    const classroomIds = enrolledClassrooms.map((c) => c.id);

    return await useDrizzle()
      .selectDistinct({
        id: classMaterials.id,
        name: classMaterials.name,
        subject: classMaterials.subject,
        chapter: classMaterials.chapter,
        source: classMaterials.source,
      })
      .from(classroomMaterials)
      .innerJoin(
        classMaterials,
        eq(classroomMaterials.materialId, classMaterials.id)
      )
      .where(inArray(classroomMaterials.classroomId, classroomIds))
      .limit(limit);
  }

  if (args.teacherId) {
    return await useDrizzle()
      .select({
        id: classMaterials.id,
        name: classMaterials.name,
        subject: classMaterials.subject,
        chapter: classMaterials.chapter,
        source: classMaterials.source,
      })
      .from(classMaterials)
      .where(eq(classMaterials.teacherId, args.teacherId))
      .limit(limit);
  }

  return [];
};
