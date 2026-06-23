import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  foreignKey,
  interval,
  uniqueIndex,
  index,
  vector,
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

export const problems = pgTable(
  "problems",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    content: text("content").notNull(),
    choices: jsonb("choices").notNull(),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation"),
    difficulty: text("difficulty"),
    subject: text("subject"),
    chapter: text("chapter"),
    grade: text("grade"),
    source: text("source"),
    imageUrl: text("image_url"),
    hashtags: jsonb("hashtags").$type<string[]>().default([]),
    embedding: vector("embedding", { dimensions: 1536 }),
    aiGenerated: boolean("ai_generated").default(false),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    embeddingIdx: index("problems_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

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

export const chatProjects = pgTable("chat_projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  role: text("role").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatHistory = pgTable("chat_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id),
  projectId: text("project_id").references(() => chatProjects.id, {
    onDelete: "set null",
  }),
  title: text("title"),
  messages: jsonb("messages")
    .$type<import("ai").UIMessage[]>()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teacherChatHistory = pgTable("teacher_chat_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id),
  projectId: text("project_id").references(() => chatProjects.id, {
    onDelete: "set null",
  }),
  title: text("title"),
  messages: jsonb("messages")
    .$type<import("ai").UIMessage[]>()
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

export const problemsStatus = pgTable(
  "problems_status",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    isWrong: boolean("is_wrong").default(false).notNull(),
    understood: boolean("understood").default(false).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      userProblemUnique: uniqueIndex("problems_status_user_problem_unique").on(
        table.userId,
        table.problemId
      ),
    };
  }
);

export const postsTemplate = pgTable(
  "posts_template",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id),
    template: text("template").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      templateUnique: uniqueIndex("posts_template_user_classroom_unique").on(
        table.userId,
        table.classroomId
      ),
    };
  }
);

export type AiInteractionAttachment = {
  url: string;
  mediaType: string;
  filename?: string;
};

export const aiInteractionLogs = pgTable(
  "ai_interaction_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventKey: text("event_key").notNull(),
    chatId: text("chat_id").notNull(),
    messageId: text("message_id"),
    toolCallId: text("tool_call_id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    userRole: text("user_role").notNull(),
    eventType: text("event_type").notNull(),
    status: text("status").notNull().default("completed"),
    content: text("content"),
    attachments: jsonb("attachments").$type<AiInteractionAttachment[]>(),
    toolName: text("tool_name"),
    toolInput: jsonb("tool_input").$type<unknown>(),
    toolOutput: jsonb("tool_output").$type<unknown>(),
    finishReason: text("finish_reason"),
    durationMs: integer("duration_ms"),
    error: text("error"),
    classroomId: text("classroom_id"),
    projectId: text("project_id"),
    stepNumber: integer("step_number"),
    modelId: text("model_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    eventKeyUnique: uniqueIndex("ai_interaction_logs_event_key_unique").on(
      table.eventKey,
    ),
    chatCreatedIndex: index("ai_interaction_logs_chat_created_idx").on(
      table.chatId,
      table.createdAt,
    ),
    createdIndex: index("ai_interaction_logs_created_idx").on(table.createdAt),
  }),
);

export const teacherAvailability = pgTable("teacher_availability", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  maxStudents: integer("max_students").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  availabilityId: text("availability_id")
    .notNull()
    .references(() => teacherAvailability.id),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id),
  status: text("status").notNull().default("pending"),
  studentNote: text("student_note"),
  teacherNote: text("teacher_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const testbanks = pgTable("testbanks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const testbankProblems = pgTable(
  "testbank_problems",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    testbankId: text("testbank_id")
      .notNull()
      .references(() => testbanks.id, { onDelete: "cascade" }),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    testbankProblemUnique: uniqueIndex("testbank_problems_unique").on(
      table.testbankId,
      table.problemId
    ),
  })
);

export const testbankClassrooms = pgTable(
  "testbank_classrooms",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    testbankId: text("testbank_id")
      .notNull()
      .references(() => testbanks.id, { onDelete: "cascade" }),
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    testbankClassroomUnique: uniqueIndex("testbank_classrooms_unique").on(
      table.testbankId,
      table.classroomId
    ),
  })
);
