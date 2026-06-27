import { roleRequests } from "../../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const session = await requireAuthSession(event);

  const request = await useDrizzle().query.roleRequests.findFirst({
    where: eq(roleRequests.userId, session.user.id),
  });

  return { hasRequestedRole: !!request };
});
