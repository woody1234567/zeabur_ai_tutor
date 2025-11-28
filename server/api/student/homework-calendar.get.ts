import { eq, inArray } from "drizzle-orm";
import { classroomStudents, homeworks, personalEvents } from "~~/db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const userId = session.user.id;

  // 1. Get all classrooms the student is in
  const studentClassrooms = await useDrizzle()
    .select({ classroomId: classroomStudents.classroomId })
    .from(classroomStudents)
    .where(eq(classroomStudents.studentId, userId));

  if (studentClassrooms.length === 0) {
    return [];
  }

  const classroomIds = studentClassrooms.map((c) => c.classroomId);

  // 2. Get all homeworks for those classrooms
  const homeworkList = await useDrizzle()
    .select()
    .from(homeworks)
    .where(inArray(homeworks.classroomId, classroomIds));

  // 3. Map to FullCalendar events
  const homeworkEvents = homeworkList
    .filter((hw) => hw.deadline)
    .map((hw) => ({
      id: hw.id,
      title: `${hw.subject ? `[${hw.subject}] ` : ""}${hw.title}`,
      start: hw.deadline as Date,
      allDay: true,
      color: "#3788d8", // Default blue for homework
      extendedProps: {
        type: "homework",
      },
    }));

  // 4. Get personal events
  const personalEventsList = await useDrizzle()
    .select()
    .from(personalEvents)
    .where(eq(personalEvents.userId, userId));

  const personalCalendarEvents = personalEventsList.map((evt) => ({
    id: evt.id,
    title: evt.title,
    start: evt.start,
    end: evt.end,
    allDay: evt.allDay ?? true,
    color: "#10b981", // Green for personal events
    extendedProps: {
      type: "personal",
    },
  }));

  return [...homeworkEvents, ...personalCalendarEvents];
});
