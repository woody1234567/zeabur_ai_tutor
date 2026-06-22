export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const user = session.user;
  if (user.role !== "teacher" && user.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);
  return updateProject(id, user.id, "teacher", body);
});
