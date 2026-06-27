import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import type { ToolSet } from "ai";

// Confirmed Composio toolkit slugs
export const COMPOSIO_TOOLKITS = ["gmail", "googlecalendar", "googledrive"] as const;
export type ComposioToolkit = (typeof COMPOSIO_TOOLKITS)[number];

let _composio: Composio<VercelProvider> | null = null;

function getComposio(): Composio<VercelProvider> {
  if (!_composio) {
    const config = useRuntimeConfig();
    _composio = new Composio({
      provider: new VercelProvider(),
      apiKey: config.composioApiKey as string,
    });
  }
  return _composio;
}

export async function getComposioTools(userId: string, toolkits: string[]): Promise<ToolSet> {
  const session = await getComposio().create(userId, {
    toolkits,
    manageConnections: true,
  });
  return session.tools() as Promise<ToolSet>;
}

export async function authorizeComposioToolkit(
  userId: string,
  toolkit: string,
  callbackUrl: string
) {
  const session = await getComposio().create(userId, { toolkits: [toolkit] });
  const connectionRequest = await session.authorize(toolkit, { callbackUrl });
  return { redirectUrl: connectionRequest.redirectUrl };
}

export async function getComposioToolkitStatus(
  userId: string,
  toolkits: string[]
) {
  const session = await getComposio().create(userId, { toolkits });
  const { items } = await session.toolkits();
  return Object.fromEntries(
    items.map((tk) => [tk.slug, tk.connection?.isActive ?? false])
  );
}
