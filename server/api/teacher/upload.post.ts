import { PutObjectCommand } from "@aws-sdk/client-s3";
// @ts-ignore
import { r2 } from "../../utils/r2";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const files = await readMultipartFormData(event);
  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No file uploaded",
    });
  }

  const file = files[0]!;
  const config = useRuntimeConfig();

  if (
    !config.r2AccessKeyId ||
    !config.r2SecretAccessKey ||
    !config.r2AccountId ||
    !config.r2BucketName
  ) {
    console.error("Missing R2 configuration");
    throw createError({
      statusCode: 500,
      statusMessage: "R2 configuration is missing",
    });
  }

  const filename = file.filename || "unknown";
  const contentType = file.type || "application/octet-stream";
  const key = `problems/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: config.r2BucketName,
    Key: key,
    Body: file.data,
    ContentType: contentType,
  });

  try {
    await r2.send(command);

    return {
      imageUrl: `${config.r2PublicDomain}/${key}`,
    };
  } catch (error: any) {
    console.error("Error uploading to R2:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload image: ${error.message}`,
    });
  }
});
