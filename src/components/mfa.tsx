"use client";

import { useState } from "react";
import { MfaTotp } from "./mfa-totp";
import { MfaSms } from "./mfa-sms";

export function Mfa() {
  const [authType, setAuthType] = useState<"totp" | "sms">("totp");
  return (
    <>
      <select
        onChange={(e) => setAuthType(e.target.value as "totp" | "sms")}
        value={authType}
      >
        <option value="totp">TOTP</option>
        <option value="sms">SMS</option>
      </select>
      <div>{authType === "totp" ? <MfaTotp /> : <MfaSms />}</div>
    </>
  );
}
