"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  MonitorSmartphone,
  Pencil,
  ShieldCheck,
  ShieldOff,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  ME_QUERY,
  SESSIONS_QUERY,
  UPDATE_PROFILE_MUTATION,
  type ClientSession,
  type ClientUser,
  type Typed,
} from "~/lib/client-api";
import { describeUserAgent, errorMessage, formatDate, initials } from "~/lib/format";
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
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";

function fullName(user: Pick<ClientUser, "firstName" | "lastName">): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
}

export function UserProfileCard() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [sessions, setSessions] = useState<ClientSession[]>([]);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, startSaving] = useTransition();

  const loadSessions = useCallback(async () => {
    setSessionsError(null);
    try {
      // Sessions require a session-bound token, so fetch them independently:
      // a sessions failure shouldn't blank out the whole profile.
      const data = await runClientApi<{ sessions: ClientSession[] }>(
        SESSIONS_QUERY,
      );
      // Surface the current session first, then most-recently-active.
      setSessions(
        [...data.sessions].sort((a, b) => {
          if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
          return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
        }),
      );
    } catch (e) {
      setSessionsError(errorMessage(e, "Couldn't load your sessions."));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await runClientApi<{ me: ClientUser }>(ME_QUERY);
      setUser(data.me);
    } catch (e) {
      setLoadError(errorMessage(e, "Failed to load your profile."));
    } finally {
      setLoading(false);
    }
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEditing = () => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEditing(true);
  };

  const save = () => {
    if (!user) return;
    startSaving(async () => {
      try {
        const data = await runClientApi<{
          updateProfile: Typed & { user?: ClientUser };
        }>(UPDATE_PROFILE_MUTATION, {
          input: { firstName: firstName.trim(), lastName: lastName.trim() },
        });

        const result = data.updateProfile;
        if (result.__typename === "ProfileUpdated" && result.user) {
          setUser(result.user);
          setEditing(false);
          toast.success("Profile updated.");
        } else if (result.__typename === "InvalidLocale") {
          toast.error("That locale isn't a valid BCP 47 tag.");
        } else {
          toast.error("Couldn't update your profile.");
        }
      } catch (e) {
        toast.error(errorMessage(e, "Couldn't update your profile."));
      }
    });
  };

  if (loading) return <ProfileCardSkeleton />;

  if (loadError || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>{loadError ?? "No user found."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void load()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const name = fullName(user);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            {user.profilePictureUrl && (
              <AvatarImage src={user.profilePictureUrl} alt={name || user.email} />
            )}
            <AvatarFallback>{initials(name || user.email)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-lg">{name || "Unnamed user"}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              {user.email}
              {user.emailVerified && (
                <CheckCircle2 className="size-3.5 text-emerald-500" aria-label="Verified" />
              )}
            </CardDescription>
          </div>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil /> Edit
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  disabled={saving}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} size="sm">
                {saving && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <X /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={user.firstName} />
            <Field label="Last name" value={user.lastName} />
            <Field
              label="Email verified"
              value={user.emailVerified ? "Yes" : "No"}
            />
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">
                Multi-factor auth
              </dt>
              <dd className="flex items-center gap-1.5 text-sm">
                {user.mfaEnabled ? (
                  <>
                    <ShieldCheck className="size-4 text-emerald-500" />
                    Enabled
                    {user.mfaLastUsedAt && (
                      <span className="text-muted-foreground">
                        · last used {formatDate(user.mfaLastUsedAt)}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <ShieldOff className="size-4 text-muted-foreground" />
                    Not enabled
                  </>
                )}
              </dd>
            </div>
            <Field label="Member since" value={formatDate(user.createdAt)} />
          </dl>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">
              Active sessions
              <span className="ml-1.5 text-muted-foreground">
                ({sessions.length})
              </span>
            </h3>
          </div>

          {sessionsError ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">{sessionsError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadSessions()}
              >
                Retry
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {sessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  );
}

function SessionRow({ session }: { session: ClientSession }) {
  const location = session.currentLocation
    ? `${session.currentLocation.cityName}, ${session.currentLocation.countryISOCode}`
    : null;

  return (
    <li className="flex items-center justify-between gap-4 p-3">
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {describeUserAgent(session.userAgent)}
          </span>
          {session.isCurrent && (
            <Badge variant="secondary" className="text-[10px]">
              This device
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {[location, session.ipAddress].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground">
        <p>Active {formatDate(session.lastActivityAt ?? session.createdAt)}</p>
        <p>{session.state.tag}</p>
      </div>
    </li>
  );
}

function ProfileCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}
