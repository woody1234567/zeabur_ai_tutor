import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  foreignKey,
  interval,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  lastLogin: timestamp("last_login"),
  role: text("role"),
  banned: boolean("banned"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const problems = pgTable("problems", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  choices: jsonb("choices").notNull(), // Storing as JSON
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  difficulty: text("difficulty"),
  source: text("source"), // Added per user request
  imageUrl: text("image_url"),
  hashtags: jsonb("hashtags").$type<string[]>().default([]), // Added hashtags column
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classrooms = pgTable("classrooms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classroomStudents = pgTable("classroom_students", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const submissions = pgTable("submissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  problemId: text("problem_id")
    .notNull()
    .references(() => problems.id),
  userAnswer: text("user_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const homeworks = pgTable("homeworks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  classroomId: text("classroom_id") // Kept for backward compatibility, but made nullable logically if needed. Though schema says notNull(), we might make it nullable or just leave it. Let's make it nullable in definition if we can, or just keep it as is and fill with one ID.
    .references(() => classrooms.id), // Removing .notNull() to allow flexible assignment in future.
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id),
  subject: text("subject"),
  title: text("title"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const homeworkClassrooms = pgTable("homework_classrooms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  homeworkId: text("homework_id")
    .notNull()
    .references(() => homeworks.id),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
});

export const homeworkProblems = pgTable("homework_problems", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  homeworkId: text("homework_id")
    .notNull()
    .references(() => homeworks.id),
  problemId: text("problem_id")
    .notNull()
    .references(() => problems.id),
  order: text("order"), // Using text for simplicity, or integer if preferred. Let's stick to integer if possible, but text is fine for simple ordering or we can use serial. Wait, user asked for "problems_HW records which problems are assigned to which homework".
  // Let's use integer for order if we want to order them.
});

export const hwRecords = pgTable("hw_records", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  homeworkId: text("homework_id")
    .notNull()
    .references(() => homeworks.id),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  problemId: text("problem_id")
    .notNull()
    .references(() => problems.id),
  userAnswer: text("user_answer"),
  correctness: boolean("correctness").notNull(),
  submitted: boolean("submitted").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const homeworkCompletions = pgTable("homework_completions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  homeworkId: text("homework_id")
    .notNull()
    .references(() => homeworks.id),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const personalEvents = pgTable("personal_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  title: text("title").notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end"),
  allDay: boolean("all_day").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pendingParent = pgTable("pending_parent", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id")
    .notNull()
    .references(() => user.id),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roleRequests = pgTable("role_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parentStudents = pgTable("parent_students", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id")
    .notNull()
    .references(() => user.id),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatHistory = pgTable("chat_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id),
  title: text("title"),
  messages: jsonb("messages")
    .$type<{ role: "user" | "assistant"; content: string }[]>()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classMaterials = pgTable(
  "class_materials",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => user.id),
    name: text("name").notNull(),
    path: text("path").notNull(), // Full path in bucket or virtual path for folders
    url: text("url"),
    type: text("type"), // MIME type or 'folder'
    size: integer("size"),
    subject: text("subject"),
    chapter: text("chapter"),
    source: text("source"),
    hashtags: jsonb("hashtags").$type<string[]>().default([]),
    isFolder: boolean("is_folder").default(false).notNull(),
    parentId: text("parent_id"), // Self-reference, can be null for root
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      parentFk: foreignKey({
        columns: [table.parentId],
        foreignColumns: [table.id],
        name: "class_materials_parent_id_fk",
      }),
    };
  }
);

export const classroomMaterials = pgTable("classroom_materials", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
  materialId: text("material_id")
    .notNull()
    .references(() => classMaterials.id), // Linking to the root folder/file being shared
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id),
  content: text("content"),
  classDate: text("class_date"),
  classStartTime: timestamp("class_start_time"),
  classEndTime: timestamp("class_end_time"),
  classLength: interval("class_length"), // derived from start/end
  attendees: jsonb("attendees").$type<string[]>().default([]), // List of student IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const favorites = pgTable("favorites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  problemId: text("problem_id")
    .notNull()
    .references(() => problems.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const errorProblems = pgTable("error_problems", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  problemId: text("problem_id")
    .notNull()
    .references(() => problems.id),
  understood: boolean("understood").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
