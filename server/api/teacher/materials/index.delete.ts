import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { classMaterials } from "../../../../db/schema";
import { db } from "../../../../server/utils/db";
import { eq, and, count } from "drizzle-orm";
import { classMaterialsR2 } from "../../../../server/utils/r2";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const query = getQuery(event);
  const id = query.id as string;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID required" });
  }

  const item = await db.query.classMaterials.findFirst({
    where: (cm, { eq, and }) =>
      and(eq(cm.id, id), eq(cm.teacherId, session.user.id)),
  });

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }

  const { classMaterialsR2BucketName } = useRuntimeConfig();

  if (item.isFolder) {
    // Check for children
    const childrenRequest = await db
      .select({ count: count() })
      .from(classMaterials)
      .where(eq(classMaterials.parentId, id));
    // drizzle select({ count: count() }) returns array [{ count: number }]
    const hasChildren = childrenRequest[0]?.count > 0;

    if (hasChildren) {
      // For MVP, blocking delete of non-empty folders
      throw createError({ statusCode: 400, statusMessage: "Folder not empty" });
    }

    // Delete folder record
    await db.delete(classMaterials).where(eq(classMaterials.id, id));
  } else {
    // Delete file from R2
    try {
      await classMaterialsR2.send(
        new DeleteObjectCommand({
          Bucket: classMaterialsR2BucketName,
          Key: item.path,
        })
      );
    } catch (e) {
      console.error("R2 Delete Error", e);
      // Proceed to delete from DB even if R2 fails? Ideally yes to keep consistency if file is gone or inaccessible.
    }

    // Delete from DB
    await db.delete(classMaterials).where(eq(classMaterials.id, id));
  }

  return { success: true };
});
