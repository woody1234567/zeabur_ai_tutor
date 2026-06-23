import { createAuthClient } from "better-auth/vue";
import { adminClient } from "better-auth/client/plugins";
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NUXT_PUBLIC_BASE_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
