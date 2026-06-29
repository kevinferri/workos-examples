import {
  getSignInUrl,
  getSignUpUrl,
  withAuth,
} from "@workos-inc/authkit-nextjs";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { OrganizationMembershipsTable } from "~/components/organization-memberships-table";
import { UserProfileCard } from "~/components/user-profile-card";

export default async function DemoPage() {
  const { user } = await withAuth();

  if (!user) {
    // AuthKit's callback decodes `state` (base64 JSON) to decide where to
    // redirect after auth. Encode `/demo` so users land back here.
    const state = Buffer.from(
      JSON.stringify({ returnPathname: "/demo" }),
    ).toString("base64");
    const withReturn = (url: string) => `${url}&state=${state}`;
    const signInUrl = withReturn(await getSignInUrl());
    const signUpUrl = withReturn(await getSignUpUrl());

    return (
      <div className="mx-auto flex min-h-svh max-w-4xl items-center justify-center p-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Client GraphQL API Demo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild>
              <Link href={signInUrl}>Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={signUpUrl}>Create an account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.email}
        </p>
      </header>

      <UserProfileCard />
      <OrganizationMembershipsTable />
    </div>
  );
}
