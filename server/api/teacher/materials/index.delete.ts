import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { classMaterials } from "../../../../db/schema";
import { eq, count } from "drizzle-orm";
import { classMaterialsR2 } from "../../../../server/utils/r2";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const query = getQuery(event);
  const id = query.id as string;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "ID required" });
  }

  const item = await useDrizzle().query.classMaterials.findFirst({
    where: (cm, { eq, and }) =>
      and(eq(cm.id, id), eq(cm.teacherId, session.user.id)),
  });

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }

  const { classMaterialsR2BucketName } = useRuntimeConfig();

  if (item.isFolder) {
    // Check for children
    const childrenRequest = await useDrizzle()
      .select({ count: count() })
      .from(classMaterials)
      .where(eq(classMaterials.parentId, id));
    const hasChildren = (childrenRequest[0]?.count ?? 0) > 0;

    if (hasChildren) {
      throw createError({ statusCode: 400, statusMessage: "Folder not empty" });
    }

    // Delete folder record
    await useDrizzle().delete(classMaterials).where(eq(classMaterials.id, id));
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
    }

    // Delete from DB
    await useDrizzle().delete(classMaterials).where(eq(classMaterials.id, id));
  }

  return { success: true };
});
