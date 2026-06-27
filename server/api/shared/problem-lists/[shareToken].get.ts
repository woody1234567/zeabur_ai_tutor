import {
  problemLists,
  problemListItems,
  problems,
  user,
} from "../../../../db/schema";
import { auth } from "../../../utils/auth";
import { eq, and, inArray, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const shareToken = getRouterParam(event, "shareToken");
  if (!shareToken) throw createError({ statusCode: 400 });

  // Find list by share token
  const [list] = await useDrizzle()
    .select({
      id: problemLists.id,
      name: problemLists.name,
      description: problemLists.description,
      ownerId: problemLists.ownerId,
    })
    .from(problemLists)
    .where(eq(problemLists.shareToken, shareToken))
    .limit(1);

  if (!list) throw createError({ statusCode: 404, statusMessage: "List not found or sharing disabled" });

  // Get owner display name
  const [owner] = await useDrizzle()
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, list.ownerId))
    .limit(1);

  // Get all items in the list
  const items = await useDrizzle()
    .select({
      problemId: problemListItems.problemId,
      addedAt: problemListItems.addedAt,
    })
    .from(problemListItems)
    .where(eq(problemListItems.listId, list.id))
    .orderBy(problemListItems.addedAt);

  if (items.length === 0) {
    return {
      list: { id: list.id, name: list.name, description: list.description, ownerName: owner?.name ?? "" },
      items: [],
    };
  }

  const problemIds = items.map((i) => i.problemId);

  // Try to get viewer identity (optional — no throw if unauthenticated)
  const session = await auth.api.getSession({ headers: event.headers }).catch(() => null);
  const viewerId = session?.user?.role === "student" ? session.user.id : null;
  const viewerRole = session?.user?.role ?? null;

  // Build visibility condition based on viewer
  let visibilityCondition;
  if (viewerRole === "admin") {
    // Admin sees all
    visibilityCondition = sql`1=1`;
  } else if (viewerRole === "teacher" && session?.user?.id) {
    // Teacher sees public or own testbank
    const teacherId = session.user.id;
    visibilityCondition = sql`EXISTS (
      SELECT 1 FROM testbank_problems tp
      JOIN testbanks tb ON tb.id = tp.testbank_id
      WHERE tp.problem_id = ${problems.id}
      AND (tb.is_public = true OR tb.owner_id = ${teacherId})
    )`;
  } else if (viewerId) {
    // Authenticated student: public OR shared with their classroom
    visibilityCondition = sql`EXISTS (
      SELECT 1 FROM testbank_problems tp
      JOIN testbanks tb ON tb.id = tp.testbank_id
      WHERE tp.problem_id = ${problems.id}
      AND (
        tb.is_public = true
        OR tb.id IN (
          SELECT tc.testbank_id FROM testbank_classrooms tc
          WHERE tc.classroom_id IN (
            SELECT cs.classroom_id FROM classroom_students cs
            WHERE cs.student_id = ${viewerId}
          )
        )
      )
    )`;
  } else {
    // Unauthenticated: only public testbank problems
    visibilityCondition = sql`EXISTS (
      SELECT 1 FROM testbank_problems tp
      JOIN testbanks tb ON tb.id = tp.testbank_id
      WHERE tp.problem_id = ${problems.id}
      AND tb.is_public = true
    )`;
  }

  // Fetch only accessible problems
  const accessibleProblems = await useDrizzle()
    .select({
      id: problems.id,
      title: problems.title,
      content: problems.content,
      choices: problems.choices,
      difficulty: problems.difficulty,
      subject: problems.subject,
      chapter: problems.chapter,
      grade: problems.grade,
      source: problems.source,
      hashtags: problems.hashtags,
      imageUrl: problems.imageUrl,
    })
    .from(problems)
    .where(and(inArray(problems.id, problemIds), visibilityCondition));

  const accessibleMap = new Map(accessibleProblems.map((p) => [p.id, p]));

  const resultItems = items.map((item) => {
    const problem = accessibleMap.get(item.problemId);
    if (problem) {
      return { problemId: item.problemId, addedAt: item.addedAt, accessible: true, problem };
    }
    return { problemId: item.problemId, addedAt: item.addedAt, accessible: false, problem: null };
  });

  return {
    list: { id: list.id, name: list.name, description: list.description, ownerName: owner?.name ?? "" },
    items: resultItems,
  };
});
