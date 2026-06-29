/**
 * Typed operations for the WorkOS Client GraphQL API.
 *
 * Query/mutation strings plus the TypeScript shapes they return, shared by the
 * client components that call `runClientApi`. Union-returning mutations always
 * select `__typename` so callers can branch on the domain result.
 *
 * See `client-schema.gql` for the full schema.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClientUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  mfaEnabled: boolean;
  mfaLastUsedAt: string | null;
}

export interface SessionLocation {
  cityName: string;
  countryISOCode: string;
}

export interface SessionState {
  tag: string;
  expiresAt: string | null;
}

export interface ClientSession {
  id: string;
  isCurrent: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  currentLocation: SessionLocation | null;
  state: SessionState;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  description: string | null;
}

export interface RolesResult {
  multipleRolesEnabled: boolean;
  roles: Role[];
}

export interface MemberRole {
  name: string;
  slug: string;
}

export type MemberStatus =
  | "Active"
  | "InviteExpired"
  | "InviteRevoked"
  | "Invited"
  | "NoInvite";

export interface OrganizationMember {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  lastActivityAt: string | null;
  status: MemberStatus;
  roles: MemberRole[];
}

export interface ListMetadata {
  before: string | null;
  after: string | null;
}

export interface OrganizationMemberList {
  data: OrganizationMember[];
  listMetadata: ListMetadata;
}

/** Every union mutation result carries its concrete type name here. */
export interface Typed {
  __typename: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const ME_QUERY = /* GraphQL */ `
  query Me {
    me {
      id
      email
      firstName
      lastName
      profilePictureUrl
      emailVerified
      createdAt
      mfaEnabled
      mfaLastUsedAt
    }
  }
`;

export const SESSIONS_QUERY = /* GraphQL */ `
  query Sessions {
    sessions {
      id
      isCurrent
      ipAddress
      userAgent
      lastActivityAt
      createdAt
      currentLocation {
        cityName
        countryISOCode
      }
      state {
        tag
        expiresAt
      }
    }
  }
`;

export const ROLES_QUERY = /* GraphQL */ `
  query Roles {
    roles {
      multipleRolesEnabled
      roles {
        id
        name
        slug
        isDefault
        description
      }
    }
  }
`;

const MEMBER_FIELDS = /* GraphQL */ `
  id
  email
  emailVerified
  firstName
  lastName
  profilePictureUrl
  lastActivityAt
  status
  roles {
    name
    slug
  }
`;

export const MEMBERSHIPS_QUERY = /* GraphQL */ `
  query Memberships(
    $limit: Int
    $after: String
    $before: String
    $roleSlug: String
    $search: String
  ) {
    organizationMemberships(
      limit: $limit
      after: $after
      before: $before
      roleSlug: $roleSlug
      search: $search
    ) {
      data { ${MEMBER_FIELDS} }
      listMetadata {
        before
        after
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const UPDATE_PROFILE_MUTATION = /* GraphQL */ `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      __typename
      ... on ProfileUpdated {
        user {
          id
          email
          firstName
          lastName
          profilePictureUrl
          emailVerified
          createdAt
          mfaEnabled
          mfaLastUsedAt
        }
      }
      ... on InvalidLocale {
        _placeholder
      }
    }
  }
`;

export const INVITE_USER_MUTATION = /* GraphQL */ `
  mutation InviteUser($input: InviteUserInput!) {
    inviteUser(input: $input) {
      __typename
      ... on UserInvited {
        invitation {
          id
          email
          roleSlug
          status
          expiresAt
        }
      }
      ... on InvalidInviteeEmail {
        email
      }
      ... on InvalidInviteeRole {
        roleSlug
      }
      ... on InviteeAlreadyInvited {
        email
      }
      ... on InviteeAlreadyMember {
        email
      }
      ... on InvalidInvitationExpiry {
        _placeholder
      }
    }
  }
`;

export const UPDATE_MEMBER_ROLE_MUTATION = /* GraphQL */ `
  mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
    updateMemberRole(input: $input) {
      __typename
      ... on MemberRoleUpdated {
        member { ${MEMBER_FIELDS} }
      }
      ... on MemberNotFound {
        userId
      }
      ... on RoleNotFound {
        roleSlug
      }
    }
  }
`;

export const REMOVE_MEMBER_MUTATION = /* GraphQL */ `
  mutation RemoveMember($input: RemoveMemberInput!) {
    removeMember(input: $input) {
      __typename
      ... on MemberRemoved {
        userId
      }
      ... on MemberNotFound {
        userId
      }
    }
  }
`;
