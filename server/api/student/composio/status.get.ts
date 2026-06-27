import { getComposioToolkitStatus, COMPOSIO_TOOLKITS } from "../../../utils/composio";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;

  if (user.role !== "student" && user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  return getComposioToolkitStatus(user.id, [...COMPOSIO_TOOLKITS]);
});
