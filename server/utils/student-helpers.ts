import {
  classrooms,
  classroomStudents,
  user,
  homeworks,
  homeworkCompletions,
  hwRecords,
  homeworkProblems,
} from "../../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const getStudentClassrooms = async (studentId: string) => {
  const studentClassrooms = await useDrizzle()
    .select({
      id: classrooms.id,
      name: classrooms.name,
      description: classrooms.description,
      teacherName: user.name,
      joinedAt: classroomStudents.joinedAt,
    })
    .from(classroomStudents)
    .innerJoin(classrooms, eq(classroomStudents.classroomId, classrooms.id))
    .innerJoin(user, eq(classrooms.teacherId, user.id))
    .where(eq(classroomStudents.studentId, studentId));

  return studentClassrooms;
};

export const getStudentClassroomPerformance = async (
  studentId: string,
  classroomId: string
) => {
  // Fetch student info
  const student = await useDrizzle()
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .where(eq(user.id, studentId))
    .limit(1);

  if (student.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Student not found",
    });
  }

  // Fetch classroom info
  const classroom = await useDrizzle()
    .select()
    .from(classrooms)
    .where(eq(classrooms.id, classroomId))
    .limit(1);

  if (classroom.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "Classroom not found",
    });
  }

  // Fetch all homeworks for the classroom
  const classroomHomeworks = await useDrizzle()
    .select()
    .from(homeworks)
    .where(eq(homeworks.classroomId, classroomId))
    .orderBy(desc(homeworks.createdAt));

  const performanceData = await Promise.all(
    classroomHomeworks.map(async (hw) => {
      // Check completion status
      const completion = await useDrizzle()
        .select()
        .from(homeworkCompletions)
        .where(
          and(
            eq(homeworkCompletions.homeworkId, hw.id),
            eq(homeworkCompletions.userId, studentId)
          )
        )
        .limit(1);

      // Calculate score
      // Total problems
      const totalProblemsResult = await useDrizzle()
        .select({ count: sql<number>`count(*)` })
        .from(homeworkProblems)
        .where(eq(homeworkProblems.homeworkId, hw.id));
      const totalProblems = Number(totalProblemsResult[0]?.count || 0);

      // Correct answers
      const correctAnswersResult = await useDrizzle()
        .select({ count: sql<number>`count(*)` })
        .from(hwRecords)
        .where(
          and(
            eq(hwRecords.homeworkId, hw.id),
            eq(hwRecords.userId, studentId),
            eq(hwRecords.correctness, true)
          )
        );
      const correctAnswers = Number(correctAnswersResult[0]?.count || 0);

      const score =
        totalProblems > 0
          ? Math.round((correctAnswers / totalProblems) * 100)
          : 0;

      const isCompleted = completion.length > 0;
      const completedAt = isCompleted ? completion[0]!.completedAt : null;

      let status = "Pending";
      if (isCompleted) {
        status = "Completed";
        if (hw.deadline && new Date(completedAt!) > new Date(hw.deadline)) {
          status = "Late";
        }
      } else if (hw.deadline && new Date() > new Date(hw.deadline)) {
        status = "Overdue";
      }

      return {
        id: hw.id,
        title: hw.title,
        deadline: hw.deadline,
        status,
        score,
        totalProblems,
        correctAnswers,
        completedAt,
      };
    })
  );

  // Calculate summary stats
  const totalHomeworks = performanceData.length;
  const completedHomeworks = performanceData.filter(
    (h) => h.status === "Completed" || h.status === "Late"
  ).length;
  const lateHomeworks = performanceData.filter(
    (h) => h.status === "Late"
  ).length;
  const averageScore =
    totalHomeworks > 0
      ? Math.round(
          performanceData.reduce((acc, curr) => acc + curr.score, 0) /
            totalHomeworks
        )
      : 0;
  const completionRate =
    totalHomeworks > 0
      ? Math.round((completedHomeworks / totalHomeworks) * 100)
      : 0;

  return {
    student: student[0],
    classroom: classroom[0],
    summary: {
      averageScore,
      completionRate,
      lateHomeworks,
      totalHomeworks,
      completedHomeworks,
    },
    homeworks: performanceData,
  };
};
