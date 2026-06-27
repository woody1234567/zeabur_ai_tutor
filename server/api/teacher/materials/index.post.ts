import { PutObjectCommand } from "@aws-sdk/client-s3";
import { classMaterials } from "../../../../db/schema";
import { classMaterialsR2 } from "../../../../server/utils/r2";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const formData = await readMultipartFormData(event);

  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "No form data found",
    });
  }

  const { classMaterialsR2BucketName, classMaterialsR2PublicDomain } =
    useRuntimeConfig();

  // Parse fields
  const getField = (name: string) => {
    const item = formData.find((i) => i.name === name);
    return item ? item.data.toString() : undefined;
  };

  const parentId = getField("parentId");
  const subject = getField("subject");
  const chapter = getField("chapter");
  const source = getField("source");
  const hashtagsRaw = getField("hashtags");
  const hashtags = hashtagsRaw ? JSON.parse(hashtagsRaw) : [];

  // Find parent path
  let parentPath = "";
  if (parentId) {
    const parent = await useDrizzle().query.classMaterials.findFirst({
      where: (cm, { eq }) => eq(cm.id, parentId),
    });
    if (parent) {
      parentPath = parent.path;
    }
  }

  const files = formData.filter((i) => i.filename);
  const results = [];

  for (const file of files) {
    const filename = file.filename!;
    const key = parentPath ? `${parentPath}${filename}` : filename;

    // Upload to R2
    try {
      await classMaterialsR2.send(
        new PutObjectCommand({
          Bucket: classMaterialsR2BucketName,
          Key: key,
          Body: file.data,
          ContentType: file.type,
        })
      );

      // Insert into DB
      const url = classMaterialsR2PublicDomain
        ? `${classMaterialsR2PublicDomain}/${key}`
        : undefined;

      const [record] = await useDrizzle()
        .insert(classMaterials)
        .values({
          teacherId: session.user.id,
          name: filename,
          path: key,
          url,
          type: file.type || "application/octet-stream",
          size: file.data.length,
          subject,
          chapter,
          source,
          hashtags,
          isFolder: false,
          parentId: parentId || null,
        })
        .returning();

      results.push(record);
    } catch (error) {
      console.error("Upload error:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to upload file to storage",
      });
    }
  }

  return results;
});
