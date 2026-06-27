import { authorizeComposioToolkit } from "../../../utils/composio";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;

  if (
    user.role !== "student" &&
    user.role !== "admin"
  ) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const { toolkit } = await readBody<{ toolkit: string }>(event);
  if (!toolkit) {
    throw createError({ statusCode: 400, statusMessage: "toolkit is required" });
  }

  const config = useRuntimeConfig();
  const callbackUrl = `${config.public.baseURL}/student/ai-chat`;
  return authorizeComposioToolkit(user.id, toolkit, callbackUrl);
});
