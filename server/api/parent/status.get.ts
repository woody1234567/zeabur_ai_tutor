import { defineEventHandler } from "h3";
import { db } from "../../../db";
import { pendingParent } from "../../../db/schema";
import { requireAuthSession } from "../../utils/auth";
import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  // Check if user has a pending request
  const pendingRequest = await db.query.pendingParent.findFirst({
    where: (pendingParent, { eq, and }) =>
      and(
        eq(pendingParent.parentId, session.user.id),
        eq(pendingParent.status, "pending")
      ),
  });

  // Check if user has an approved request (effectively linked)
  const linkedRequest = await db.query.pendingParent.findFirst({
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
