import { authClient } from "../../lib/auth-client";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Allow access to auth page and public assets
  if (
    to.path === "/auth" ||
    to.path.startsWith("/assets") ||
    to.path.startsWith("/api")
  ) {
    return;
  }

  const { data: session } = await authClient.useSession(useFetch);

  if (!session.value) {
    return navigateTo("/auth");
  }
});
