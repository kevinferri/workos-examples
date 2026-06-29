"use server";

import { switchToOrganization } from "@workos-inc/authkit-nextjs";

export async function switchOrganization(organizationId: string) {
  try {
    await switchToOrganization(organizationId, {
      returnTo: "/",
      revalidationStrategy: "path",
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to switch organization:", message);
    return { success: false, error: message };
  }
}
