interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  role: string | null;
}

interface Session {
  id: string;
  expiresAt: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
}

interface SessionResponse {
  user: User;
  session: Session;
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await useFetch<SessionResponse>(
    "/api/auth/session"
  );

  // If user is not logged in, redirect to home (or login page)
  if (!session.value) {
    if (to.path !== "/auth") {
      return navigateTo("/auth");
    }
    return;
  }

  const userRole = session.value.user.role;

  // Admin routes
  if (to.path.startsWith("/admin")) {
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
