import { WorkOS } from "@workos-inc/node";
import Link from "next/link";
import styles from "./page.module.css";
import { createAuditLog } from "../actions/create-autdit-log";
import { getCustomSsoUser } from "~/lib/sso-session";
import { ssoSignOut } from "~/actions/sso-sign-out";
import {
  getSignInUrl,
  getSignUpUrl,
  withAuth,
  signOut,
} from "@workos-inc/authkit-nextjs";

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
              style={{ width: "fit-content" }}
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
            <button onClick={ssoSignOut} style={{ width: "fit-content" }}>
              Sign out
            </button>
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
