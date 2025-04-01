"use server";

import { GeneratePortalLinkIntent, WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const organizationId = process.env.TEST_ORG_ID!;

export async function generateAdminPortalLink() {
  const { link } = await workos.portal.generateLink({
    organization: organizationId,
    intent: GeneratePortalLinkIntent.SSO,
  });

  return link;
}
