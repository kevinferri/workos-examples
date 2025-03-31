import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { Profile } from "@workos-inc/node";

export async function getCustomSsoUser(): Promise<Profile | undefined> {
  const c = await cookies();
  const session = c.get(process.env.SESSION_NAME!);

  if (!session) return undefined;

  try {
    return jwt.verify(session.value, process.env.JWT_KEY);
  } catch {
    return undefined;
  }
}
