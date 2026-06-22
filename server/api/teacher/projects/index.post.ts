export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;
  if (user.role !== "teacher" && user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
  const body = await readBody(event);
  return createProject(user.id, "teacher", body);
});
