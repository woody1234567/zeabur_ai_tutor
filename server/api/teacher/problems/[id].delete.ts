import { problems, submissions, testbankProblems } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
// @ts-ignore
import { r2 } from "../../../utils/r2";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing problem ID",
    });
  }

  try {
    // 1. Get the problem to find the image URL
    const result = await useDrizzle()
      .select()
      .from(problems)
      .where(eq(problems.id, id))
      .limit(1);

    const problem = result[0];

    if (!problem) {
      throw createError({
        statusCode: 404,
        statusMessage: "Problem not found",
      });
    }

    // Verify ownership (admins can delete any problem)
    if (session.user.role !== "admin" && problem.createdBy !== session.user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: "You can only delete problems you created",
      });
    }

    // 2. Delete image from R2 if it exists
    if (problem.imageUrl) {
      const config = useRuntimeConfig();
      // Extract key from URL
      // URL format: https://pub-domain/problems/timestamp-filename
      // We need: problems/timestamp-filename
      let key = problem.imageUrl;
      if (problem.imageUrl.startsWith(config.r2PublicDomain)) {
        key = problem.imageUrl.replace(`${config.r2PublicDomain}/`, "");
      } else if (problem.imageUrl.startsWith("http")) {
        // Fallback if domain doesn't match exactly (e.g. protocol diff)
        const urlObj = new URL(problem.imageUrl);
        key = urlObj.pathname.substring(1); // remove leading /
      }

      console.log(`Deleting image from R2. Key: ${key}`);

      try {
        const command = new DeleteObjectCommand({
          Bucket: config.r2BucketName,
          Key: key,
        });
        await r2.send(command);
        console.log("Image deleted from R2");
      } catch (r2Error) {
        console.error("Failed to delete image from R2:", r2Error);
        // We continue to delete the problem even if image deletion fails
      }
    }

    // 3. Delete associated submissions first (Foreign Key Constraint)
    await useDrizzle().delete(submissions).where(eq(submissions.problemId, id));

    // 4. Delete from testbanks (cascade cleanup)
    await useDrizzle().delete(testbankProblems).where(eq(testbankProblems.problemId, id));

    // 5. Delete from database
    await useDrizzle().delete(problems).where(eq(problems.id, id));

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting problem:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: `Failed to delete problem: ${error.message}`,
    });
  }
});
