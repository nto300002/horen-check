import {
  AssignmentDocument,
  AuditLogDocument,
  InvitationDocument,
  UserDocument,
  UserRole
} from "../domain/firestoreModels";

type InvitableRole = Exclude<UserRole, "admin">;

export interface AdminActionInput {
  actorId: string;
  actorRole: UserRole;
  reason?: string;
}

export interface InviteUserInput extends AdminActionInput {
  id: string;
  email: string;
  role: InvitableRole;
  organizationId: string;
  invitedBy: string;
  token: string;
  existingInvitations: InvitationDocument[];
}

export interface InviteUserResult {
  invitation: InvitationDocument;
  auditLog: AuditLogDocument;
  resendExisting: boolean;
}

export interface AcceptInvitationInput {
  invitation: InvitationDocument;
  uid: string;
  name: string;
  token: string;
}

export interface AcceptInvitationResult {
  invitation: InvitationDocument;
  user: UserDocument;
  homeRoute: string;
}

export interface UpdateUserRoleInput extends AdminActionInput {
  existingUser: UserDocument;
  nextRole: UserRole;
}

export interface AssignUserInput extends AdminActionInput {
  workerId: string;
  managerId?: string;
  supporterId?: string;
  organizationId: string;
  existingAssignment?: AssignmentDocument;
}

export interface AssignmentResult {
  assignment: AssignmentDocument;
  auditLog: AuditLogDocument;
}

export interface DeactivateAssignmentInput extends AdminActionInput {
  existingAssignment: AssignmentDocument;
}

export interface DeactivateUserInput extends AdminActionInput {
  existingUser: UserDocument;
}

export interface UpdateUserResult {
  user: UserDocument;
  auditLog: AuditLogDocument;
}

export interface DeactivateUserResult extends UpdateUserResult {
  disableAuth: {
    uid: string;
    disabled: true;
  };
}

export class AdminUserManagementError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "AdminUserManagementError";
  }
}

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (normalized.length === 0) {
    throw new AdminUserManagementError("EMAIL_REQUIRED", "email is required");
  }
  return normalized;
}

function requireNonEmpty(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new AdminUserManagementError(`${fieldName.toUpperCase()}_REQUIRED`, `${fieldName} is required`);
  }
  return normalized;
}

function assertAdmin(actorRole: UserRole): void {
  if (actorRole !== "admin") {
    throw new AdminUserManagementError("ADMIN_REQUIRED", "admin role is required");
  }
}

function auditLog(input: {
  id: string;
  organizationId: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  targetUserId?: string;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  reason?: string;
  now: Date;
}): AuditLogDocument {
  return {
    id: input.id,
    organizationId: input.organizationId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    targetUserId: input.targetUserId,
    beforeValue: input.beforeValue,
    afterValue: input.afterValue,
    reason: input.reason,
    createdAt: input.now
  };
}

function auditId(action: string, targetId: string, now: Date): string {
  return `${action}_${targetId}_${now.getTime()}`;
}

function homeRouteForRole(role: UserRole): string {
  if (role === "manager") {
    return "/manager/home";
  }
  if (role === "supporter") {
    return "/supporter/home";
  }
  if (role === "admin") {
    return "/admin/users";
  }
  return "/worker/home";
}

export function inviteUserDocuments(input: InviteUserInput, now = new Date()): InviteUserResult {
  assertAdmin(input.actorRole);
  const email = normalizeEmail(input.email);
  const activePendingInvitation = input.existingInvitations.find((invitation) =>
    invitation.email === email
    && invitation.organizationId === input.organizationId
    && invitation.status === "pending"
    && invitation.expiresAt.getTime() >= now.getTime()
  );

  if (activePendingInvitation !== undefined) {
    const resentInvitation: InvitationDocument = {
      ...activePendingInvitation,
      lastSentAt: now,
      resentCount: activePendingInvitation.resentCount + 1,
      updatedAt: now
    };
    return {
      invitation: resentInvitation,
      resendExisting: true,
      auditLog: auditLog({
        id: auditId("resendInvitation", resentInvitation.id, now),
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorRole: input.actorRole,
        action: "resendInvitation",
        targetType: "invitation",
        targetId: resentInvitation.id,
        afterValue: {
          email,
          role: resentInvitation.role,
          resentCount: resentInvitation.resentCount
        },
        reason: input.reason,
        now
      })
    };
  }

  const invitation: InvitationDocument = {
    id: requireNonEmpty(input.id, "id"),
    email,
    role: input.role,
    organizationId: requireNonEmpty(input.organizationId, "organizationId"),
    invitedBy: requireNonEmpty(input.invitedBy, "invitedBy"),
    token: requireNonEmpty(input.token, "token"),
    status: "pending",
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    lastSentAt: now,
    resentCount: 0,
    createdAt: now,
    updatedAt: now
  };

  return {
    invitation,
    resendExisting: false,
    auditLog: auditLog({
      id: auditId("inviteUser", invitation.id, now),
      organizationId: invitation.organizationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "inviteUser",
      targetType: "invitation",
      targetId: invitation.id,
      afterValue: {
        email,
        role: invitation.role
      },
      reason: input.reason,
      now
    })
  };
}

export function acceptInvitationDocuments(
  input: AcceptInvitationInput,
  now = new Date()
): AcceptInvitationResult {
  if (input.invitation.status !== "pending") {
    throw new AdminUserManagementError("INVITATION_NOT_PENDING", "invitation is not pending");
  }
  if (input.invitation.expiresAt.getTime() < now.getTime()) {
    throw new AdminUserManagementError("INVITATION_EXPIRED", "invitation has expired");
  }
  if (input.invitation.token !== input.token) {
    throw new AdminUserManagementError("INVITATION_TOKEN_INVALID", "invitation token is invalid");
  }

  const uid = requireNonEmpty(input.uid, "uid");
  const user: UserDocument = {
    id: uid,
    name: requireNonEmpty(input.name, "name"),
    email: input.invitation.email,
    role: input.invitation.role,
    accountMode: "report_support_mode",
    organizationId: input.invitation.organizationId,
    active: true,
    createdAt: now,
    updatedAt: now
  };

  return {
    invitation: {
      ...input.invitation,
      status: "accepted",
      acceptedBy: uid,
      acceptedAt: now,
      updatedAt: now
    },
    user,
    homeRoute: homeRouteForRole(user.role)
  };
}

export function updateUserRoleDocuments(input: UpdateUserRoleInput, now = new Date()): UpdateUserResult {
  assertAdmin(input.actorRole);
  const user: UserDocument = {
    ...input.existingUser,
    role: input.nextRole,
    updatedAt: now
  };

  return {
    user,
    auditLog: auditLog({
      id: auditId("updateUserRole", user.id, now),
      organizationId: user.organizationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "updateUserRole",
      targetType: "user",
      targetId: user.id,
      targetUserId: user.id,
      beforeValue: {
        role: input.existingUser.role
      },
      afterValue: {
        role: input.nextRole
      },
      reason: input.reason,
      now
    })
  };
}

export function assignUserDocuments(input: AssignUserInput, now = new Date()): AssignmentResult {
  assertAdmin(input.actorRole);
  const previous = input.existingAssignment;
  const assignment: AssignmentDocument = {
    id: input.workerId,
    workerId: input.workerId,
    managerId: input.managerId,
    supporterId: input.supporterId,
    organizationId: input.organizationId,
    active: true,
    createdBy: previous?.createdBy ?? input.actorId,
    updatedBy: input.actorId,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now
  };

  return {
    assignment,
    auditLog: auditLog({
      id: auditId("assignUser", assignment.id, now),
      organizationId: assignment.organizationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "assignUser",
      targetType: "assignment",
      targetId: assignment.id,
      targetUserId: assignment.workerId,
      beforeValue: previous === undefined ? undefined : {
        managerId: previous.managerId,
        supporterId: previous.supporterId,
        active: previous.active
      },
      afterValue: {
        managerId: assignment.managerId,
        supporterId: assignment.supporterId,
        active: assignment.active
      },
      reason: input.reason,
      now
    })
  };
}

export function deactivateAssignmentDocuments(
  input: DeactivateAssignmentInput,
  now = new Date()
): AssignmentResult {
  assertAdmin(input.actorRole);
  const assignment: AssignmentDocument = {
    ...input.existingAssignment,
    active: false,
    updatedBy: input.actorId,
    deactivatedBy: input.actorId,
    deactivatedAt: now,
    updatedAt: now
  };

  return {
    assignment,
    auditLog: auditLog({
      id: auditId("deactivateAssignment", assignment.id, now),
      organizationId: assignment.organizationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "deactivateAssignment",
      targetType: "assignment",
      targetId: assignment.id,
      targetUserId: assignment.workerId,
      beforeValue: {
        active: input.existingAssignment.active
      },
      afterValue: {
        active: false
      },
      reason: input.reason,
      now
    })
  };
}

export function deactivateUserDocuments(
  input: DeactivateUserInput,
  now = new Date()
): DeactivateUserResult {
  assertAdmin(input.actorRole);
  const user: UserDocument = {
    ...input.existingUser,
    active: false,
    updatedAt: now
  };

  return {
    user,
    disableAuth: {
      uid: user.id,
      disabled: true
    },
    auditLog: auditLog({
      id: auditId("deactivateUser", user.id, now),
      organizationId: user.organizationId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: "deactivateUser",
      targetType: "user",
      targetId: user.id,
      targetUserId: user.id,
      beforeValue: {
        active: input.existingUser.active
      },
      afterValue: {
        active: false
      },
      reason: input.reason,
      now
    })
  };
}
