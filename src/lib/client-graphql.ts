/**
 * Client GraphQL API — browser-safe request helper.
 *
 * The Client API ships behind WorkOS' `graphql-public-api` flag and is served
 * from the userland process at `/client/graphql` (separate from the dashboard
 * `/graphql` schema). It is a *client* API: the browser calls it directly with
 * a session-bound bearer token that the customer's server minted (see the
 * `generateClientApiToken` server action). CORS for client origins is handled
 * server-side per-environment.
 *
 * The full schema lives in the read-only `client-schema.gql` artifact at the
 * repo root. Nothing in this module is server-only, so it is safe to import
 * into client components.
 */

const API_HOSTNAME =
  process.env.NEXT_PUBLIC_WORKOS_API_HOSTNAME ?? "api.workos.com";

export const CLIENT_GRAPHQL_ENDPOINT = `https://${API_HOSTNAME}/client/graphql`;

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: Array<string | number> }>;
}

/**
 * Execute a GraphQL operation against `/client/graphql` directly from the
 * browser with a bearer token.
 *
 * Transport / auth / permission failures surface as a top-level `errors[]`
 * (and non-2xx HTTP), while domain errors come back as data via payload unions.
 */
export async function clientGraphqlRequest<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(CLIENT_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Client GraphQL request failed: ${res.status} ${res.statusText} — ${body}`
    );
  }

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new Error(
      `Client GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`
    );
  }

  if (!json.data) {
    throw new Error("Client GraphQL response contained no data.");
  }

  return json.data;
}
