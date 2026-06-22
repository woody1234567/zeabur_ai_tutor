export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  return listProjects(session.user.id, "student");
});
