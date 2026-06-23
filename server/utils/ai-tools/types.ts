export interface AiToolContext {
  chatId: string;
  userId: string;
  userRole: "student" | "teacher";
  classroomId?: string | null;
  projectId?: string | null;
}
