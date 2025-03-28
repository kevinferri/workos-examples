import { WorkOS } from "@workos-inc/node";
import { NextRequest, NextResponse } from "next/server";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const directoryId = process.env.TEST_DIRECTORY_ID!;

export async function GET(req: NextRequest, res: NextResponse) {
  const users = await workos.directorySync.listGroups({
    directory: directoryId,
  });

  return NextResponse.json(users.data);
}
