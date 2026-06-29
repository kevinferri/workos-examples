"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  INVITE_USER_MUTATION,
  MEMBERSHIPS_QUERY,
  REMOVE_MEMBER_MUTATION,
  ROLES_QUERY,
  UPDATE_MEMBER_ROLE_MUTATION,
  type OrganizationMember,
  type OrganizationMemberList,
  type Role,
  type RolesResult,
  type Typed,
} from "~/lib/client-api";
import { errorMessage, formatDate, initials } from "~/lib/format";
import { runClientApi } from "~/lib/run-client-api";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";

const ALL_ROLES = "__all__";
const PAGE_SIZE = 10;

function memberName(m: OrganizationMember): string {
  return [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  Active: "default",
  Invited: "secondary",
  InviteExpired: "outline",
  InviteRevoked: "destructive",
  NoInvite: "outline",
};

export function OrganizationMembershipsTable() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [after, setAfter] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>(ALL_ROLES);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);

  // Track in-flight per-row mutations so we can disable the right controls.
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMembers = useCallback(
    async (cursor: string | null) => {
      const data = await runClientApi<{
        organizationMemberships: OrganizationMemberList;
      }>(MEMBERSHIPS_QUERY, {
        limit: PAGE_SIZE,
        after: cursor,
        roleSlug: roleFilter === ALL_ROLES ? null : roleFilter,
        search: debouncedSearch || null,
      });
      return data.organizationMemberships;
    },
    [roleFilter, debouncedSearch],
  );

  // Load roles once.
  useEffect(() => {
    runClientApi<{ roles: RolesResult }>(ROLES_QUERY)
      .then((d) => setRoles(d.roles.roles))
      .catch((e) => toast.error(errorMessage(e, "Couldn't load roles.")));
  }, []);

  // Reload the first page whenever a filter changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchMembers(null)
      .then((list) => {
        if (cancelled) return;
        setMembers(list.data);
        setAfter(list.listMetadata.after);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(errorMessage(e, "Couldn't load members."));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fetchMembers]);

  const loadMore = () => {
    if (!after) return;
    setLoadingMore(true);
    fetchMembers(after)
      .then((list) => {
        setMembers((prev) => [...prev, ...list.data]);
        setAfter(list.listMetadata.after);
      })
      .catch((e) => toast.error(errorMessage(e, "Couldn't load more members.")))
      .finally(() => setLoadingMore(false));
  };

  const refreshFirstPage = useCallback(() => {
    fetchMembers(null)
      .then((list) => {
        setMembers(list.data);
        setAfter(list.listMetadata.after);
      })
      .catch((e) => toast.error(errorMessage(e, "Couldn't refresh members.")));
  }, [fetchMembers]);

  const changeRole = async (member: OrganizationMember, roleSlug: string) => {
    setBusyMemberId(member.id);
    try {
      const data = await runClientApi<{
        updateMemberRole: Typed & { member?: OrganizationMember };
      }>(UPDATE_MEMBER_ROLE_MUTATION, {
        input: { userId: member.id, roleSlug },
      });
      const result = data.updateMemberRole;
      if (result.__typename === "MemberRoleUpdated" && result.member) {
        const updated = result.member;
        setMembers((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m)),
        );
        toast.success(`Updated ${memberName(member) || member.email}'s role.`);
      } else if (result.__typename === "RoleNotFound") {
        toast.error("That role no longer exists.");
      } else if (result.__typename === "MemberNotFound") {
        toast.error("That member is no longer in the organization.");
      } else {
        toast.error("Couldn't update the member's role.");
      }
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't update the member's role."));
    } finally {
      setBusyMemberId(null);
    }
  };

  const removeMember = async (member: OrganizationMember) => {
    setBusyMemberId(member.id);
    try {
      const data = await runClientApi<{
        removeMember: Typed & { userId?: string };
      }>(REMOVE_MEMBER_MUTATION, { input: { userId: member.id } });
      const result = data.removeMember;
      if (result.__typename === "MemberRemoved") {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        toast.success(`Removed ${memberName(member) || member.email}.`);
      } else if (result.__typename === "MemberNotFound") {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        toast.error("That member was already removed.");
      } else {
        toast.error("Couldn't remove the member.");
      }
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't remove the member."));
    } finally {
      setBusyMemberId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Manage who belongs to this organization and what they can do.
          </CardDescription>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus /> Invite member
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ROLES}>All roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.slug}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton />
              ) : loadError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">{loadError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={refreshFirstPage}
                    >
                      Try again
                    </Button>
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No members match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    roles={roles}
                    busy={busyMemberId === member.id}
                    disabled={busyMemberId !== null}
                    onChangeRole={changeRole}
                    onRemove={removeMember}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {after && !loading && !loadError && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore && <Loader2 className="animate-spin" />}
              Load more
            </Button>
          </div>
        )}
      </CardContent>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={roles}
        onInvited={refreshFirstPage}
      />
    </Card>
  );
}

function MemberRow({
  member,
  roles,
  busy,
  disabled,
  onChangeRole,
  onRemove,
}: {
  member: OrganizationMember;
  roles: Role[];
  busy: boolean;
  disabled: boolean;
  onChangeRole: (member: OrganizationMember, roleSlug: string) => void;
  onRemove: (member: OrganizationMember) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const name = memberName(member);
  const currentRole = member.roles[0]?.slug ?? "";

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {member.profilePictureUrl && (
              <AvatarImage src={member.profilePictureUrl} alt={name || member.email} />
            )}
            <AvatarFallback>{initials(name || member.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {name && <p className="truncate text-sm font-medium">{name}</p>}
            <p className="truncate text-xs text-muted-foreground">
              {member.email}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[member.status] ?? "outline"}>
          {member.status}
        </Badge>
      </TableCell>
      <TableCell>
        {roles.length > 0 ? (
          <Select
            value={currentRole}
            onValueChange={(slug) => onChangeRole(member, slug)}
            disabled={disabled}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="No role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.slug}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex flex-wrap gap-1">
            {member.roles.length > 0 ? (
              member.roles.map((r) => (
                <Badge key={r.slug} variant="secondary">
                  {r.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(member.lastActivityAt)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={disabled}
          onClick={() => setConfirmOpen(true)}
        >
          {busy ? <Loader2 className="animate-spin" /> : "Revoke"}
        </Button>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revoke access?</DialogTitle>
              <DialogDescription>
                {name || member.email} will be removed from this organization
                and lose access immediately. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmOpen(false);
                  onRemove(member);
                }}
              >
                Revoke access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  roles,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onInvited: () => void;
}) {
  const defaultRole = useMemo(
    () => roles.find((r) => r.isDefault)?.slug ?? roles[0]?.slug ?? "",
    [roles],
  );
  const [email, setEmail] = useState("");
  const [roleSlug, setRoleSlug] = useState(defaultRole);
  const [pending, startInvite] = useTransition();
  const initialized = useRef(false);

  // Seed the role select once roles arrive, and reset email each time we open.
  useEffect(() => {
    if (open) {
      setEmail("");
      if (!initialized.current || !roleSlug) {
        setRoleSlug(defaultRole);
        initialized.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultRole]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    startInvite(async () => {
      try {
        const data = await runClientApi<{
          inviteUser: Typed & { email?: string };
        }>(INVITE_USER_MUTATION, {
          input: { email: trimmed, roleSlug: roleSlug || null },
        });
        const result = data.inviteUser;
        switch (result.__typename) {
          case "UserInvited":
            toast.success(`Invitation sent to ${trimmed}.`);
            onOpenChange(false);
            onInvited();
            break;
          case "InviteeAlreadyMember":
            toast.error(`${trimmed} is already a member.`);
            break;
          case "InviteeAlreadyInvited":
            toast.error(`${trimmed} already has a pending invitation.`);
            break;
          case "InvalidInviteeEmail":
            toast.error("That email address isn't valid.");
            break;
          case "InvalidInviteeRole":
            toast.error("That role isn't valid for this organization.");
            break;
          case "InvalidInvitationExpiry":
            toast.error("The invitation expiry is out of range.");
            break;
          default:
            toast.error("Couldn't send the invitation.");
        }
      } catch (err) {
        toast.error(errorMessage(err, "Couldn't send the invitation."));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Invite a member</DialogTitle>
            <DialogDescription>
              We&apos;ll email an invitation to join this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={roleSlug}
                onValueChange={setRoleSlug}
                disabled={pending || roles.length === 0}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.slug}>
                      {role.name}
                      {role.isDefault ? " (default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || !email.trim()}>
              {pending && <Loader2 className="animate-spin" />}
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-6 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-24" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-8 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
