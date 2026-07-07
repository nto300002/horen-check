const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  acceptInvitationDocuments,
  AdminUserManagementError,
  assignUserDocuments,
  deactivateAssignmentDocuments,
  deactivateUserDocuments,
  inviteUserDocuments,
  updateUserRoleDocuments
} = require("../lib/usecase/adminUserManagement");

function user(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1",
    name: "Worker One",
    email: "worker@example.com",
    role: "worker",
    accountMode: "report_support_mode",
    organizationId: "org-1",
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function assignment(overrides = {}) {
  const now = new Date("2026-07-07T00:00:00.000Z");
  return {
    id: "worker-1",
    workerId: "worker-1",
    managerId: "manager-1",
    supporterId: "supporter-1",
    organizationId: "org-1",
    active: true,
    createdBy: "admin-1",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

test("creates a seven-day invitation for worker, manager, or supporter", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const result = inviteUserDocuments({
    id: "invite-1",
    email: "WORKER@example.com",
    role: "worker",
    organizationId: "org-1",
    invitedBy: "admin-1",
    actorRole: "admin",
    token: "token-1",
    existingInvitations: []
  }, now);

  assert.equal(result.invitation.email, "worker@example.com");
  assert.equal(result.invitation.status, "pending");
  assert.equal(result.invitation.expiresAt.toISOString(), "2026-07-14T00:00:00.000Z");
  assert.equal(result.resendExisting, false);
  assert.equal(result.auditLog.action, "inviteUser");
});

test("resends an existing pending invitation instead of creating a duplicate", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const existing = inviteUserDocuments({
    id: "invite-1",
    email: "worker@example.com",
    role: "worker",
    organizationId: "org-1",
    invitedBy: "admin-1",
    actorRole: "admin",
    token: "token-1",
    existingInvitations: []
  }, new Date("2026-07-06T00:00:00.000Z")).invitation;

  const result = inviteUserDocuments({
    id: "invite-2",
    email: "worker@example.com",
    role: "worker",
    organizationId: "org-1",
    invitedBy: "admin-1",
    actorRole: "admin",
    token: "token-2",
    existingInvitations: [existing]
  }, now);

  assert.equal(result.invitation.id, "invite-1");
  assert.equal(result.invitation.resentCount, 1);
  assert.equal(result.invitation.lastSentAt, now);
  assert.equal(result.resendExisting, true);
  assert.equal(result.auditLog.action, "resendInvitation");
});

test("accepts a non-expired invitation and creates the invited user", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const invitation = inviteUserDocuments({
    id: "invite-1",
    email: "manager@example.com",
    role: "manager",
    organizationId: "org-1",
    invitedBy: "admin-1",
    actorRole: "admin",
    token: "token-1",
    existingInvitations: []
  }, now).invitation;

  const result = acceptInvitationDocuments({
    invitation,
    uid: "manager-1",
    name: "Manager One",
    token: "token-1"
  }, now);

  assert.equal(result.invitation.status, "accepted");
  assert.equal(result.invitation.acceptedBy, "manager-1");
  assert.equal(result.user.role, "manager");
  assert.equal(result.homeRoute, "/manager/home");
});

test("rejects expired invitations", () => {
  const invitation = inviteUserDocuments({
    id: "invite-1",
    email: "supporter@example.com",
    role: "supporter",
    organizationId: "org-1",
    invitedBy: "admin-1",
    actorRole: "admin",
    token: "token-1",
    existingInvitations: []
  }, new Date("2026-07-01T00:00:00.000Z")).invitation;

  assert.throws(() => acceptInvitationDocuments({
    invitation,
    uid: "supporter-1",
    name: "Supporter One",
    token: "token-1"
  }, new Date("2026-07-09T00:00:00.000Z")), (error) => {
    assert.equal(error instanceof AdminUserManagementError, true);
    assert.equal(error.code, "INVITATION_EXPIRED");
    return true;
  });
});

test("updates user role and creates an audit log", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const result = updateUserRoleDocuments({
    existingUser: user(),
    nextRole: "manager",
    actorId: "admin-1",
    actorRole: "admin",
    reason: "role change"
  }, now);

  assert.equal(result.user.role, "manager");
  assert.equal(result.auditLog.action, "updateUserRole");
  assert.deepEqual(result.auditLog.beforeValue, { role: "worker" });
  assert.deepEqual(result.auditLog.afterValue, { role: "manager" });
});

test("assigns one manager and one supporter to a worker", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const result = assignUserDocuments({
    workerId: "worker-1",
    managerId: "manager-1",
    supporterId: "supporter-1",
    organizationId: "org-1",
    actorId: "admin-1",
    actorRole: "admin",
    existingAssignment: undefined
  }, now);

  assert.equal(result.assignment.id, "worker-1");
  assert.equal(result.assignment.active, true);
  assert.equal(result.assignment.managerId, "manager-1");
  assert.equal(result.assignment.supporterId, "supporter-1");
  assert.equal(result.auditLog.action, "assignUser");
});

test("deactivates assignments logically instead of deleting them", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const result = deactivateAssignmentDocuments({
    existingAssignment: assignment(),
    actorId: "admin-1",
    actorRole: "admin"
  }, now);

  assert.equal(result.assignment.active, false);
  assert.equal(result.assignment.deactivatedBy, "admin-1");
  assert.equal(result.assignment.deactivatedAt, now);
  assert.equal(result.auditLog.action, "deactivateAssignment");
});

test("deactivates users and marks auth as disabled", () => {
  const now = new Date("2026-07-07T00:00:00.000Z");
  const result = deactivateUserDocuments({
    existingUser: user(),
    actorId: "admin-1",
    actorRole: "admin",
    reason: "left organization"
  }, now);

  assert.equal(result.user.active, false);
  assert.equal(result.disableAuth.uid, "worker-1");
  assert.equal(result.disableAuth.disabled, true);
  assert.equal(result.auditLog.action, "deactivateUser");
});
