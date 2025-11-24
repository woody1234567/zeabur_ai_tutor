import { authClient } from "../../lib/auth-client";

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: useRequestHeaders(),
    },
  });

  const userRole = session?.user?.role;

  if (session) {
    console.log("Full User Object:", session.user);
    console.log("User Role:", userRole);
  }

  // Admin routes
  if (to.path.startsWith("/admin")) {
    console.log(userRole);
    if (userRole !== "admin") {
      return navigateTo("/unauthorized");
    }
  }

  // Teacher routes
  if (to.path.startsWith("/teacher")) {
    if (userRole !== "teacher" && userRole !== "admin") {
      return navigateTo("/unauthorized");
    }
  }

  // Student routes
  if (to.path.startsWith("/student")) {
    if (userRole !== "student" && userRole !== "admin") {
      return navigateTo("/unauthorized");
    }
  }
});
