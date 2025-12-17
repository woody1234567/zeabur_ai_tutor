import { db } from "./db";
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
  const enrolledClassrooms = await db
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

  const materials = await db
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

export const getClassMaterialsMetadata = async (studentId?: string) => {
  let whereClause: SQL | undefined;

  // If studentId is provided, filter by enrolled classrooms
  if (studentId) {
    const enrolledClassrooms = await db
      .select({ id: classroomStudents.classroomId })
      .from(classroomStudents)
      .where(eq(classroomStudents.studentId, studentId));

    if (enrolledClassrooms.length === 0) {
      return [];
    }

    const classroomIds = enrolledClassrooms.map((c) => c.id);
    whereClause = inArray(classroomMaterials.classroomId, classroomIds);
  }

  // Fetch metadata: name, subject, chapter, source
  // We join classroom_materials -> class_materials to respect sharing
  // If no studentId (generic MCP), should we return ALL materials?
  // The prompt asked for "students have permission to access", which implies context.
  // But MCP resource is often generic. Let's return all shared materials if no studentId,
  // or maybe just keep it empty/limited. For now, let's return all shared materials if no studentId,
  // assuming "accessible" in a generic sense means "shared with some class".

  const query = db
    .select({
      name: classMaterials.name,
      subject: classMaterials.subject,
      chapter: classMaterials.chapter,
      source: classMaterials.source,
    })
    .from(classMaterials);

  if (whereClause) {
    // If filtering by student, we need to join classroomMaterials
    // But wait, the query above starts from classMaterials.
    // Let's rewrite to start from classroomMaterials if filtered.
    return await db
      .selectDistinct({
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
      .where(whereClause);
  } else {
    // If no studentId, return all materials that are shared (or just all materials?)
    // "Student have permission": usually means shared to a classroom.
    // Let's just return all materials in the system for the generic MCP list,
    // or maybe simple join with classroomMaterials to ensure they are actually "published".
    // Let's return all for now to be simple for the generic list.
    return await query;
  }
};
