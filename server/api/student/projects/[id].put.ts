export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);
  return updateProject(id, session.user.id, "student", body);
});
