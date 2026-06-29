import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Profile } from "@workos-inc/node";

export async function getCustomSsoUser(): Promise<Profile | undefined> {
  const c = await cookies();
  const session = c.get(process.env.SESSION_NAME!);

  if (!session) return undefined;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_KEY);
    const { payload } = await jwtVerify(session.value, secret);
    return payload as unknown as Profile;
  } catch {
    return undefined;
  }
}
