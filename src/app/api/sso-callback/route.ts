import { WorkOS } from "@workos-inc/node";
import { NextRequest, NextResponse } from "next/server";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID!;
const organization = process.env.TEST_ORG_ID;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { message: "Missing 'code' query parameter" },
      { status: 400 }
    );
  }

  const { profile } = await workos.sso.getProfileAndToken({ code, clientId });

  if (profile.organizationId !== organization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/sso", req.url));
}
