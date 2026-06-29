import { generateClientApiToken } from "~/actions/generate-client-api-token";
import { clientGraphqlRequest } from "~/lib/client-graphql";

/**
 * Mint a session-bound token on the server, then run an operation against
 * `/client/graphql` directly from the browser. Shared by all client components
 * that talk to the Client API.
 */
export async function runClientApi<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const { token, error } = await generateClientApiToken();
  if (!token) throw new Error(error ?? "Failed to mint token");
  return clientGraphqlRequest<T>(token, query, variables);
}
