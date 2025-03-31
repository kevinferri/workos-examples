"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { WorkOS } from "@workos-inc/node";
import { revalidatePath } from "next/cache";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function createAuditLog(data: FormData) {
  const payload = data.get("audit-log-payload")?.toString() ?? "";
  const { user } = await withAuth();

  if (!user) return;

  await workos.auditLogs.createEvent(process.env.TEST_ORG_ID!, {
    action: "user.custom_log",
    occurredAt: new Date(),
    actor: {
      type: "user",
      id: user.id,
    },
    metadata: {
      payload,
    },
    targets: [
      {
        type: "team",
        id: process.env.TEST_TEAM_ID!,
      },
    ],
    context: {
      location: "123.123.123.123",
      userAgent: "Chrome/104.0.0.0",
    },
  });

  revalidatePath("/");
}
