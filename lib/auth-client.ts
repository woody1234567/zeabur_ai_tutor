import { createAuthClient } from "better-auth/vue";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.PROD
    ? typeof window !== "undefined"
      ? window.location.origin
      : "https://ai-tutor-new-seven.vercel.app"
    : "http://localhost:3000",
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
