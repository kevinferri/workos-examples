import { WorkOS } from "@workos-inc/node";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const clientId = process.env.WORKOS_CLIENT_ID!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const c = await cookies();

  if (!code) {
    return NextResponse.json(
      { message: "Missing 'code' query parameter" },
      { status: 400 }
    );
  }

  const { profile } = await workos.sso.getProfileAndToken({
    code,
    clientId,
  });

  if (!profile) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.JWT_KEY);
  const token = await new SignJWT({ ...profile })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);

  c.set(process.env.SESSION_NAME!, token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return NextResponse.redirect(new URL("/", req.url));
}
