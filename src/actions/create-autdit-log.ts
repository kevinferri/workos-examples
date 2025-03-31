"use server";

import { WorkOS } from "@workos-inc/node";
import { revalidatePath } from "next/cache";
import { getLoggedInUser } from "~/lib/session";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function createAuditLog(data: FormData) {
  const payload = data.get("audit-log-payload")?.toString() ?? "";
  const profile = await getLoggedInUser();

  if (!profile?.organizationId) return;

  await workos.auditLogs.createEvent(profile.organizationId, {
    action: "user.custom_log",
    occurredAt: new Date(),
    actor: {
      type: "user",
      id: "user_01GBNJC3MX9ZZJW1FSTF4C5938",
    },
    metadata: {
      payload,
    },
    targets: [
      {
        type: "team",
        id: "team_01GBNJD4MKHVKJGEWK42JNMBGS",
      },
    ],
    context: {
      location: "123.123.123.123",
      userAgent: "Chrome/104.0.0.0",
    },
  });

  revalidatePath("/");
}
