import { db } from "../../../db";
import { problems, problemsStatus } from "../../../db/schema";
import { auth } from "../../../server/utils/auth";
import { and, eq, ilike, sql } from "drizzle-orm";
import { updateProblemStatus } from "../../../server/utils/problemStatus";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const userId = session.user.id;
  const userRole = session.user.role as string;

  const query = getQuery(event);
  const title = query.title as string;
  const source = query.source as string;
  const hashtag = query.hashtag as string;
  const subject = query.subject as string;
  const chapter = query.chapter as string;
  const grade = query.grade as string;
  const difficulty = query.difficulty as string;
  const tab = query.tab as string;
  const testbankId = query.testbankId as string;
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize as string) || 12));

  const filters = [];

  // --- Existing search filters ---
  if (title) filters.push(ilike(problems.title, `%${title}%`));
  if (source) filters.push(ilike(problems.source, `%${source}%`));
  if (hashtag) {
    filters.push(sql`${problems.hashtags} @> ${JSON.stringify([hashtag])}`);
  }
  if (subject) filters.push(eq(problems.subject, subject));
  if (chapter) filters.push(ilike(problems.chapter, `%${chapter}%`));
  if (grade) filters.push(eq(problems.grade, grade));
  if (difficulty) filters.push(eq(problems.difficulty, difficulty));

  // --- Visibility filtering based on tab / testbankId / role ---
  if (testbankId) {
    // Specific testbank: verify visibility before returning problems
    // Admin can see any testbank; teacher can see public or own; student can see public or shared with their classrooms
    if (userRole === "admin") {
      filters.push(
        sql`EXISTS (
          SELECT 1 FROM testbank_problems tp
          WHERE tp.problem_id = ${problems.id}
          AND tp.testbank_id = ${testbankId}
        )`
      );
    } else if (userRole === "teacher") {
      filters.push(
        sql`EXISTS (
          SELECT 1 FROM testbank_problems tp
          JOIN testbanks tb ON tb.id = tp.testbank_id
          WHERE tp.problem_id = ${problems.id}
          AND tp.testbank_id = ${testbankId}
          AND (tb.is_public = true OR tb.owner_id = ${userId})
        )`
      );
    } else {
      // student (or other roles): public or shared with their classrooms
      filters.push(
        sql`EXISTS (
          SELECT 1 FROM testbank_problems tp
          JOIN testbanks tb ON tb.id = tp.testbank_id
          WHERE tp.problem_id = ${problems.id}
          AND tp.testbank_id = ${testbankId}
          AND (
            tb.is_public = true
            OR tb.id IN (
              SELECT tc.testbank_id FROM testbank_classrooms tc
              WHERE tc.classroom_id IN (
                SELECT cs.classroom_id FROM classroom_students cs
                WHERE cs.student_id = ${userId}
              )
            )
          )
        )`
      );
    }
  } else if (tab === "public") {
    // Only problems in public testbanks
    filters.push(
      sql`EXISTS (
        SELECT 1 FROM testbank_problems tp
        JOIN testbanks tb ON tb.id = tp.testbank_id
        WHERE tp.problem_id = ${problems.id}
        AND tb.is_public = true
      )`
    );
  } else if (tab === "mine") {
    // Only problems in the calling teacher's own testbanks
    filters.push(
      sql`EXISTS (
        SELECT 1 FROM testbank_problems tp
        JOIN testbanks tb ON tb.id = tp.testbank_id
        WHERE tp.problem_id = ${problems.id}
        AND tb.owner_id = ${userId}
      )`
    );
  } else {
    // Default: all visible problems based on role
    if (userRole === "admin") {
      // Admin sees all problems — no visibility filter needed
    } else if (userRole === "teacher") {
      // Teacher sees problems in public testbanks + their own private testbanks
      filters.push(
        sql`EXISTS (
          SELECT 1 FROM testbank_problems tp
          JOIN testbanks tb ON tb.id = tp.testbank_id
          WHERE tp.problem_id = ${problems.id}
          AND (tb.is_public = true OR tb.owner_id = ${userId})
        )`
      );
    } else {
      // Student: problems in public testbanks + private testbanks shared with their classrooms
      filters.push(
        sql`EXISTS (
          SELECT 1 FROM testbank_problems tp
          JOIN testbanks tb ON tb.id = tp.testbank_id
          WHERE tp.problem_id = ${problems.id}
          AND (
            tb.is_public = true
            OR tb.id IN (
              SELECT tc.testbank_id FROM testbank_classrooms tc
              WHERE tc.classroom_id IN (
                SELECT cs.classroom_id FROM classroom_students cs
                WHERE cs.student_id = ${userId}
              )
            )
          )
        )`
      );
    }
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  // Visibility predicate (referencing alias `tb`) used when aggregating the
  // testbanks each problem belongs to, so students/teachers only see the
  // testbanks they are allowed to see.
  const testbankVisibility =
    userRole === "admin"
      ? sql`true`
      : userRole === "teacher"
        ? sql`(tb.is_public = true OR tb.owner_id = ${userId})`
        : sql`(
            tb.is_public = true
            OR tb.id IN (
              SELECT tc.testbank_id FROM testbank_classrooms tc
              WHERE tc.classroom_id IN (
                SELECT cs.classroom_id FROM classroom_students cs
                WHERE cs.student_id = ${userId}
              )
            )
          )`;

  // Sync status first
  await updateProblemStatus(userId);

  const [countResult, allProblems] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(problems)
      .where(whereClause),
    db
      .select({
        id: problems.id,
        title: problems.title,
        difficulty: problems.difficulty,
        subject: problems.subject,
        chapter: problems.chapter,
        grade: problems.grade,
        source: problems.source,
        hashtags: problems.hashtags,
        testbanks: sql<
          { name: string; ownerName: string }[]
        >`(
          SELECT COALESCE(
            json_agg(
              json_build_object('name', tb.name, 'ownerName', u.name)
              ORDER BY tb.name
            ),
            '[]'::json
          )
          FROM testbank_problems tp
          JOIN testbanks tb ON tb.id = tp.testbank_id
          JOIN "user" u ON u.id = tb.owner_id
          WHERE tp.problem_id = ${problems.id}
          AND ${testbankVisibility}
        )`,
        isFavorite: problemsStatus.isFavorite,
        isWrong: problemsStatus.isWrong,
        understood: problemsStatus.understood,
      })
      .from(problems)
      .leftJoin(
        problemsStatus,
        and(
          eq(problemsStatus.problemId, problems.id),
          eq(problemsStatus.userId, userId)
        )
      )
      .where(whereClause)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const total = Number(countResult[0]!.count);

  return {
    data: allProblems.map((p) => ({
      ...p,
      isFavorite: p.isFavorite ?? false,
      isWrong: p.isWrong ?? false,
      understood: p.understood ?? false,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
