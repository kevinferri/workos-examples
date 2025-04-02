"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { challengeMfa } from "~/actions/challenge-mfa";
import { enrollMfa } from "~/actions/enroll-mfa";
import { verifyMfa } from "~/actions/verify-mfa";

export function Mfa() {
  const [factor, setFactor] = useState<Awaited<ReturnType<typeof enrollMfa>>>();
  const [challenge, setChallenge] =
    useState<Awaited<ReturnType<typeof challengeMfa>>>();
  const [verification, setVerification] =
    useState<Awaited<ReturnType<typeof verifyMfa>>>();
  const [isPending, startTransition] = useTransition();

  const handleEnroll = () => {
    startTransition(async () => {
      const response = await enrollMfa();
      setFactor(response);
    });
  };

  const handleChallenge = () => {
    startTransition(async () => {
      if (!factor) return;
      const response = await challengeMfa(factor.id);
      setChallenge(response);
    });
  };

  const handleVerify = () => {
    startTransition(async () => {
      if (!challenge || !factor?.totp?.secret) return;
      const response = await verifyMfa(challenge.id, factor.totp.secret);
      setVerification(response);
    });
  };

  const handleReset = () => {
    setFactor(undefined);
    setChallenge(undefined);
    setVerification(undefined);
  };

  return (
    <>
      {!factor && !challenge && (
        <button onClick={handleEnroll} disabled={isPending}>
          {isPending ? "Enrolling..." : "Enroll"}
        </button>
      )}

      {factor && !challenge && (
        <>
          <button onClick={handleChallenge} disabled={isPending}>
            {isPending ? "Challenging..." : "Challenge with factor:"}
          </button>
          {factor.totp?.qrCode && (
            <Image
              height={200}
              width={200}
              src={factor.totp.qrCode}
              alt="qr code"
            />
          )}
          <pre>{JSON.stringify(factor, null, 2)}</pre>
        </>
      )}

      {challenge && !verification && (
        <>
          <button onClick={handleVerify} disabled={isPending}>
            {isPending ? "Verifying..." : "Verify with challenge:"}
          </button>
          <pre>{JSON.stringify(challenge, null, 2)}</pre>
        </>
      )}

      {verification && (
        <>
          <pre>{JSON.stringify(verification, null, 2)}</pre>
          <button onClick={handleReset}>Reset</button>
        </>
      )}
    </>
  );
}
