"use client";

import { useState, useTransition } from "react";
import { generateAdminPortalLink } from "~/actions/generate-admin-portal-link";

export function AdminPortalLink() {
  const [link, setLink] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const response = await generateAdminPortalLink();
      setLink(response);
    });
  };

  return (
    <>
      <button onClick={handleClick} disabled={isPending}>
        {isPending ? "Generating..." : "Generate link"}
      </button>
      <div>
        {link && (
          <a href={link} target="_blank">
            {link}
          </a>
        )}
      </div>
    </>
  );
}
