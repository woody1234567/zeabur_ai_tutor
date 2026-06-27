import { pendingParent } from "../../../db/schema";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  // Check if user has a pending request
  const pendingRequest = await useDrizzle().query.pendingParent.findFirst({
    where: (pendingParent, { eq, and }) =>
      and(
        eq(pendingParent.parentId, session.user.id),
        eq(pendingParent.status, "pending")
      ),
  });

  // Check if user has an approved request (effectively linked)
  const linkedRequest = await useDrizzle().query.pendingParent.findFirst({
    where: (pendingParent, { eq, and }) =>
      and(
        eq(pendingParent.parentId, session.user.id),
        eq(pendingParent.status, "linked")
      ),
  });

  return {
    isPending: !!pendingRequest,
    isLinked: !!linkedRequest,
  };
});
