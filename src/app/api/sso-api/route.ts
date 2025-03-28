import { NextRequest, NextResponse } from "next/server";

const clientId = process.env.WORKOS_CLIENT_ID!;
const connectionId = process.env.TEST_CONNECTION_ID!;
const redirectUri = process.env.SSO_REDIRECT_URI;
const endpoint = "https://api.workos.com/sso/authorize";

export async function GET(req: NextRequest, res: NextResponse) {
  return NextResponse.redirect(
    `${endpoint}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&connection=${connectionId}`
  );
}
