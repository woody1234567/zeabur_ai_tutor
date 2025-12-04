import { db } from "../../../db";
import { roleRequests } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { requireAuthSession } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  const request = await db.query.roleRequests.findFirst({
    where: eq(roleRequests.userId, session.user.id),
  });

  return { hasRequestedRole: !!request };
});
