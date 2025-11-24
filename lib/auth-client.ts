import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", // Adjust if deploying
});

export const { signIn, signOut, useSession } = authClient;
