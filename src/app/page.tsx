import {
  getSignInUrl,
  getSignUpUrl,
  signOut,
  withAuth,
} from "@workos-inc/authkit-nextjs";
import { WorkOS } from "@workos-inc/node";
import Link from "next/link";
import { ssoSignOut } from "~/actions/sso-sign-out";
import { AdminPortalLink } from "~/components/admin-portal-link";
import { Mfa } from "~/components/mfa";
import { getCustomSsoUser } from "~/lib/sso-session";
import { createAuditLog } from "../actions/create-autdit-log";
import styles from "./page.module.css";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const directoryId = process.env.TEST_DIRECTORY_ID!;

export default async function Home() {
  const { user } = await withAuth();
  const signInUrl = await getSignInUrl();
  const signUpUrl = await getSignUpUrl();
  const customSsoUser = await getCustomSsoUser();

  const users = await workos.directorySync.listUsers({
    directory: directoryId,
  });

  const groups = await workos.directorySync.listGroups({
    directory: directoryId,
  });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>AuthKit</h2>
        {user ? (
          <>
            <pre>{JSON.stringify(user, null, 2)}</pre>
            <button
              onClick={async () => {
                "use server";
                await signOut();
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href={signInUrl}>
              <button>Sign in</button>
            </Link>
            <Link href={signUpUrl}>
              <button>Sign up</button>
            </Link>
          </>
        )}
      </div>
      <div className={styles.card}>
        <h2>SSO</h2>
        {customSsoUser ? (
          <>
            <pre>{JSON.stringify(customSsoUser, null, 2)}</pre>
            <button onClick={ssoSignOut}>Sign out</button>
          </>
        ) : (
          <>
            <a href="/api/sso-api">
              <button>API</button>
            </a>
            <a href="/api/sso-sdk">
              <button>SDK</button>
            </a>
          </>
        )}
      </div>

      <div className={styles.card}>
        <h2>Audit Logs</h2>
        <form action={createAuditLog} className={styles.auditLogForm}>
          <input
            type="text"
            name="audit-log-payload"
            placeholder="Log payload"
            required
          />
          <button type="submit">Submit</button>
        </form>
      </div>

      <div className={styles.card}>
        <h2>Admin Portal</h2>
        <AdminPortalLink />
      </div>

      <div className={styles.card}>
        <h2>MFA</h2>
        {user ? <Mfa /> : <p>Sign in via AuthKit to enroll MFA</p>}
      </div>

      <div className={styles.card}>
        <h2>Directory Sync (Users)</h2>
        <pre>{JSON.stringify(users, null, 2)}</pre>
      </div>

      <div className={styles.card}>
        <h2>Directory Sync (Groups)</h2>
        <pre>{JSON.stringify(groups, null, 2)}</pre>
      </div>
    </div>
  );
}
