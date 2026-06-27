import { eq, and, isNull, ilike, sql } from "drizzle-orm";
import { classMaterials } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const query = getQuery(event);
  const parentId = query.parentId as string | undefined;

  // Search filters
  const keyword = query.keyword as string | undefined;
  const subject = query.subject as string | undefined;
  const chapter = query.chapter as string | undefined;
  const source = query.source as string | undefined;
  const hashtags = query.hashtags as string | undefined;

  const isSearch = keyword || subject || chapter || source || hashtags;

  const conditions = [eq(classMaterials.teacherId, session.user.id)];

  if (isSearch) {
    // If searching, ignore folder structure (global search)
    if (keyword) {
      conditions.push(ilike(classMaterials.name, `%${keyword}%`));
    }
    if (subject) {
      conditions.push(ilike(classMaterials.subject, `%${subject}%`));
    }
    if (chapter) {
      conditions.push(ilike(classMaterials.chapter, `%${chapter}%`));
    }
    if (source) {
      conditions.push(ilike(classMaterials.source, `%${source}%`));
    }
    if (hashtags) {
      conditions.push(
        sql`${classMaterials.hashtags} @> ${JSON.stringify([hashtags])}::jsonb`
      );
    }
  } else {
    // Navigation mode
    if (parentId) {
      conditions.push(eq(classMaterials.parentId, parentId));
    } else {
      conditions.push(isNull(classMaterials.parentId));
    }
  }

  const materials = await useDrizzle()
    .select()
    .from(classMaterials)
    .where(and(...conditions))
    .orderBy(classMaterials.isFolder, classMaterials.createdAt);

  return materials.sort((a, b) => {
    if (a.isFolder === b.isFolder) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.isFolder ? -1 : 1;
  });
});
