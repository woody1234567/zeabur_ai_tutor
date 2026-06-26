export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  if (!session?.user || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  const config = useRuntimeConfig();
  const apiKey = config.googleVisionApiKey || process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: "Google Vision API key is not configured",
    });
  }

  const body = await readBody(event);
  const { image } = body; // Expecting base64 string

  if (!image) {
    throw createError({
      statusCode: 400,
      message: "Image data is required",
    });
  }

  // ~6.8M chars ≈ 5MB raw image after base64 encoding
  if (image.length > 6_800_000) {
    throw createError({
      statusCode: 413,
      message: "Image too large (max 5MB)",
    });
  }

  try {
    const response = await $fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        body: {
          requests: [
            {
              image: {
                content: image.split(",")[1] || image, // Remove data URL prefix if present
              },
              features: [
                {
                  type: "TEXT_DETECTION",
                },
              ],
            },
          ],
        },
      }
    );

    const textAnnotations = (response as any).responses[0]?.textAnnotations;
    const extractedText = textAnnotations?.[0]?.description || "";

    return { text: extractedText };
  } catch (error: any) {
    console.error("Google Vision API Error:", error);
    if (error.data) {
      console.error("Error Data:", JSON.stringify(error.data, null, 2));
    }
    throw createError({
      statusCode: 500,
      message: "Failed to process image with Google Vision API",
    });
  }
});
