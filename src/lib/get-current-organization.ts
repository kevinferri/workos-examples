import { withAuth } from "@workos-inc/authkit-nextjs";

export async function getCurrentOrganizationId(): Promise<string | undefined> {
  try {
    const { organizationId } = await withAuth({ ensureSignedIn: false });
    return organizationId ?? process.env.TEST_ORG_ID;
  } catch {
    return process.env.TEST_ORG_ID;
  }
}
