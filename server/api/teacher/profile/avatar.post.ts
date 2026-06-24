import { PutObjectCommand } from "@aws-sdk/client-s3";
// @ts-ignore
import { r2 } from "../../../utils/r2";
import { user } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    throw createError({ statusCode: 403, statusMessage: "Unauthorized" });
  }

  const files = await readMultipartFormData(event);
  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
  }

  const file = files[0]!;
  const contentType = file.type || "application/octet-stream";

  if (!contentType.startsWith("image/")) {
    throw createError({ statusCode: 400, statusMessage: "File must be an image" });
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.data.length > maxSize) {
    throw createError({ statusCode: 400, statusMessage: "File size must be under 5MB" });
  }

  const config = useRuntimeConfig();

  if (!config.r2AccessKeyId || !config.r2SecretAccessKey || !config.r2AccountId || !config.r2BucketName) {
    throw createError({ statusCode: 500, statusMessage: "R2 configuration is missing" });
  }

  const ext = (file.filename || "image").split(".").pop() || "jpg";
  const key = `avatars/${session.user.id}-${Date.now()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: config.r2BucketName,
    Key: key,
    Body: file.data,
    ContentType: contentType,
  });

  try {
    await r2.send(command);

    const imageUrl = `${config.r2PublicDomain}/${key}`;

    await useDrizzle()
      .update(user)
      .set({ image: imageUrl, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    return { imageUrl };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload avatar: ${error.message}`,
    });
  }
});
