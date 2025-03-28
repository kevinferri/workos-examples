import { NextRequest, NextResponse } from "next/server";
import { WorkOS } from "@workos-inc/node";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID!;
const redirectUri = process.env.SSO_REDIRECT_URI!;
const organization = process.env.TEST_ORG_ID!;

export function GET(req: NextRequest, res: NextResponse) {
  const authorizationUrl = workos.sso.getAuthorizationUrl({
    organization,
    redirectUri,
    clientId,
  });

  return NextResponse.redirect(authorizationUrl);
}
