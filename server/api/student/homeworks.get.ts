import { eq, inArray } from "drizzle-orm";
import {
  classrooms,
  classroomStudents,
  homeworks,
  homeworkCompletions,
} from "~~/db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const studentId = session.user.id;

  // 1. Find all classrooms the student is in
  const studentClassrooms = await useDrizzle()
    .select()
    .from(classroomStudents)
    .where(eq(classroomStudents.studentId, studentId));

  if (studentClassrooms.length === 0) {
    return [];
  }

  const classroomIds = studentClassrooms.map((sc) => sc.classroomId);

  // 2. Fetch all homeworks for these classrooms
  const allHomeworks = await useDrizzle()
    .select({
      id: homeworks.id,
      title: homeworks.title,
      subject: homeworks.subject,
      deadline: homeworks.deadline,
      classroomId: homeworks.classroomId,
      createdAt: homeworks.createdAt,
    })
    .from(homeworks)
    .where(inArray(homeworks.classroomId, classroomIds));

  // 3. Fetch classroom details for grouping
  const classroomDetails = await useDrizzle()
    .select({
      id: classrooms.id,
      name: classrooms.name,
    })
    .from(classrooms)
    .where(inArray(classrooms.id, classroomIds));

  // 4. Fetch completions
  const completions = await useDrizzle()
    .select()
    .from(homeworkCompletions)
    .where(eq(homeworkCompletions.userId, studentId));

  // 5. Group homeworks by classroom
  const result = classroomDetails.map((classroom) => {
    const classroomHomeworks = allHomeworks
      .filter((hw) => hw.classroomId === classroom.id)
      .map((hw) => ({
        ...hw,
        isCompleted: completions.some((c) => c.homeworkId === hw.id),
      }));
    return {
      classroom,
      homeworks: classroomHomeworks,
    };
  });

  return result;
});
