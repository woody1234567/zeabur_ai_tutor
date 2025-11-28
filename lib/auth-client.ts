import { createAuthClient } from "better-auth/vue";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.PROD
    ? "https://www.studywithwoody.site/"
    : "http://localhost:3000",
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
