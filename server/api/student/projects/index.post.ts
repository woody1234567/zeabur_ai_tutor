export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const body = await readBody(event);
  return createProject(session.user.id, "student", body);
});
