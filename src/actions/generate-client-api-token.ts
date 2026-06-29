"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { workos } from "~/lib/workos";

// The Widgets token endpoint currently exposes a single scope. The Client API
// maps `widgets:<widget>:<action>` grants onto `resource:action` scopes under
// the hood (the migration shim), so this is sufficient to mint a usable token
// for read queries like `me` during closed beta.
const DEFAULT_SCOPES: ["widgets:users-table:manage"] = [
  "widgets:users-table:manage",
];

/**
 * Mint a Client API bearer token for the currently signed-in AuthKit user.
 *
 * This is the server half of the SPA flow: token issuance needs the WorkOS API
 * key, so it must stay on the server. The browser then presents the returned
 * token directly to `/client/graphql`.
 */
export async function generateClientApiToken(): Promise<{
  token?: string;
  error?: string;
}> {
  try {
    const { user, organizationId } = await withAuth({ ensureSignedIn: true });

    if (!user) {
      throw new Error("No authenticated user — cannot mint a Client API token.");
    }

    const orgId = organizationId ?? process.env.TEST_ORG_ID;
    if (!orgId) {
      throw new Error(
        "No organization in session and TEST_ORG_ID is unset — cannot mint token."
      );
    }

    const token = await workos.widgets.getToken({
      userId: user.id,
      organizationId: orgId,
      scopes: DEFAULT_SCOPES,
    });

    return { token };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to mint Client API token:", message);
    return { error: message };
  }
}
