"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function verifyMfa(
  authenticationChallengeId: string,
  code: string
) {
  const { user } = await withAuth();

  if (!user) return undefined;

  console.log(authenticationChallengeId);

  return await workos.mfa.verifyChallenge({ authenticationChallengeId, code });
}
