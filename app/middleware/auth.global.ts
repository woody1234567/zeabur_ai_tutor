import { authClient } from "../../lib/auth-client";

export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath();
  const getRouteBaseName = useRouteBaseName();
  const routeBaseName = getRouteBaseName(to);

  // Allow access to MCP routes
  console.log("Middleware checking path:", to.path);
  // if (to.path.includes("/mcp")) return;

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
          if (routeBaseName !== "pending") {
            return navigateTo(localePath("/pending"));
          }
        } else {
          if (routeBaseName !== "role_picking") {
            return navigateTo(localePath("/role_picking"));
          }
        }
      } catch (error) {
        console.error("Failed to check role request status:", error);
      }
    }
  }

  // Prevent other roles from accessing pending page
  if (routeBaseName === "pending" && userRole !== "user") {
    if (userRole === "admin") return navigateTo(localePath("/admin")); // Redirect to admin dashboard (index)
    if (userRole === "teacher") return navigateTo(localePath("/teacher"));
    if (userRole === "student") return navigateTo(localePath("/student"));
    if (userRole === "parent") return navigateTo(localePath("/parent"));
    return navigateTo(localePath("/"));
  }

  // Admin routes
  if (typeof routeBaseName === "string" && routeBaseName.startsWith("admin")) {
    console.log(userRole);
    if (userRole !== "admin") {
      return navigateTo(localePath("/unauthorized"));
    }
  }

  // Teacher routes
  if (
    typeof routeBaseName === "string" &&
    routeBaseName.startsWith("teacher")
  ) {
    if (userRole !== "teacher" && userRole !== "admin") {
      return navigateTo(localePath("/unauthorized"));
    }
  }

  // Student routes
  if (
    typeof routeBaseName === "string" &&
    routeBaseName.startsWith("student")
  ) {
    if (userRole !== "student" && userRole !== "admin") {
      return navigateTo(localePath("/unauthorized"));
    }
  }

  // Parent routes
  if (typeof routeBaseName === "string" && routeBaseName.startsWith("parent")) {
    if (userRole !== "parent" && userRole !== "admin") {
      return navigateTo(localePath("/unauthorized"));
    }
  }
});
