export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const id = getRouterParam(event, "id")!;
  return deleteProject(id, session.user.id, "student");
});
