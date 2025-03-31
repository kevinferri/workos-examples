import { WorkOS } from "@workos-inc/node";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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

  const { profile, accessToken } = await workos.sso.getProfileAndToken({
    code,
    clientId,
  });

  if (!profile) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = jwt.sign(profile, process.env.JWT_KEY, {
    expiresIn: "1d",
  });

  c.set(process.env.SESSION_NAME!, token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return NextResponse.redirect(new URL("/", req.url));
}
