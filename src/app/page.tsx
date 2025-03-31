import { WorkOS } from "@workos-inc/node";
import styles from "./page.module.css";
import { createAuditLog } from "../actions/create-autdit-log";
import { getLoggedInUser } from "~/lib/session";
import { logOut } from "~/actions/logout";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const directoryId = process.env.TEST_DIRECTORY_ID!;

export default async function Home() {
  const loggedInUser = await getLoggedInUser();

  const users = await workos.directorySync.listUsers({
    directory: directoryId,
  });

  const groups = await workos.directorySync.listGroups({
    directory: directoryId,
  });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>SSO</h2>
        {loggedInUser ? (
          <>
            <pre>{JSON.stringify(loggedInUser, null, 2)}</pre>
            <button onClick={logOut} style={{ width: "fit-content" }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <a href="/api/sso-api">
              <button>SSO standalone API</button>
            </a>
            <a href="/api/sso-sdk">
              <button>SSO SDK</button>
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
