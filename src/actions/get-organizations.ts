"use server";

import { workos } from "~/lib/workos";

export async function getOrganizations() {
  try {
    const response = await workos.organizations.listOrganizations({
      limit: 100,
    });
    return response.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch organizations:", message);
    return [];
  }
}
