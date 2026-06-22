export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const query = getQuery(event);
  return listChats(session.user.id, "student", {
    projectId: query.projectId as string | undefined,
    unorganized: query.unorganized === "true",
  });
});
