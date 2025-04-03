"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function enrollMfa(type: "sms" | "totp" | "generic_otp") {
  const { user } = await withAuth();
  if (!user) return undefined;

  if (type === "sms") {
    return await workos.mfa.enrollFactor({
      type: "sms",
      phoneNumber: process.env.TEST_PHONE_NUMBER!,
    });
  }

  if (type === "totp") {
    return await workos.mfa.enrollFactor({
      type: "totp",
      issuer: "Foo Corp",
      user: user.email,
    });
  }

  return undefined;
}
