"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import type { Organization } from "@workos-inc/node";

export function OrganizationSwitcher({
  organizations,
  initialOrgId,
}: {
  organizations: Organization[];
  initialOrgId?: string;
}) {
  const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId || "");
  const [isPending, startTransition] = useTransition();
  const { switchToOrganization } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    // Update local state immediately for instant feedback
    setSelectedOrgId(orgId);

    // Then switch on WorkOS side
    startTransition(async () => {
      if (orgId) {
        await switchToOrganization(orgId, {
          returnTo: "/",
          revalidationStrategy: "path",
        });
      }
    });
  };

  if (organizations.length === 0) {
    return <p>No organizations available</p>;
  }

  return (
    <select
      onChange={handleChange}
      value={selectedOrgId}
      disabled={isPending}
    >
      <option value="">Select organization...</option>
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
