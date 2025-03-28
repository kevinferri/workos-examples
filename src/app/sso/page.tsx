import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.buttonContainer}>
      <a href="/api/sso-sdk">
        <button>SSO SDK</button>
      </a>
      <a href="/api/sso-api">
        <button>SSO standalone API</button>
      </a>
    </div>
  );
}
