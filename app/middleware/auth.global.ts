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

    if (userRole === "user") {
      try {
        const { hasRequestedRole } = await $fetch(
          "/api/user/has-requested-role",
          {
            headers: useRequestHeaders(["cookie"]),
          }
        );

        if (hasRequestedRole) {
          if (to.path !== "/pending") {
            return navigateTo("/pending");
          }
        } else {
          if (to.path !== "/role_picking") {
            return navigateTo("/role_picking");
          }
        }
      } catch (error) {
        console.error("Failed to check role request status:", error);
      }
    }
  }

  // Prevent other roles from accessing pending page
  if (to.path === "/pending" && userRole !== "user") {
    if (userRole === "admin") return navigateTo("/admin/dashboard");
    if (userRole === "teacher") return navigateTo("/teacher/dashboard");
    if (userRole === "student") return navigateTo("/student/dashboard");
    if (userRole === "parent") return navigateTo("/parent");
    return navigateTo("/");
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

  // Parent routes
  if (to.path.startsWith("/parent")) {
    if (userRole !== "parent" && userRole !== "admin") {
      return navigateTo("/unauthorized");
    }
  }
});
