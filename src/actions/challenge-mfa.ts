"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function challengeMfa(
  authenticationFactorId: string,
  smsTemplate?: string
) {
  const { user } = await withAuth();

  if (!user) return undefined;

  return await workos.mfa.challengeFactor({
    authenticationFactorId,
    smsTemplate,
  });
}
