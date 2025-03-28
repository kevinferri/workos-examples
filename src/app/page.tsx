import { WorkOS } from "@workos-inc/node";
import styles from "./page.module.css";

const workos = new WorkOS(process.env.WORKOS_API_KEY);
const directoryId = process.env.TEST_DIRECTORY_ID!;

export default async function Home() {
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
        <a href="/api/sso-api">
          <button>SSO standalone API</button>
        </a>
        <a href="/api/sso-sdk">
          <button>SSO SDK</button>
        </a>
      </div>

      <div className={styles.card}>
        <h2>Audit Logs</h2>
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
