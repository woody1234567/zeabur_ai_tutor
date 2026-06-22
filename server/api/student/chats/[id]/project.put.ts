export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);
  return moveChatToProject(id, body.projectId ?? null, session.user.id, "student");
});
