import { createAuthClient } from "better-auth/vue";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000", // Adjust if deploying
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
