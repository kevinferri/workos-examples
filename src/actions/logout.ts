"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function logOut() {
  const c = await cookies();
  c.set(process.env.SESSION_NAME!, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  revalidatePath("/");
}
