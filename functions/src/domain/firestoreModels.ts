export type UserRole = "worker" | "manager" | "supporter" | "admin";
export type AccountMode = "notification_mode" | "report_support_mode";
export type NotificationType = "AM_START" | "AM_END" | "PM_START" | "PM_END" | "CUSTOM";
export type NotificationEventStatus = "pending" | "notified" | "failed" | "snoozed" | "cancelled";
export type ReportType = "AM_START" | "AM_END" | "PM_START" | "PM_END";
export type ReportStatus = "completed" | "progress" | "consultation";
export type WorkStyle = "remote" | "office" | "day_off";
export type EmploymentContext = "supported_facility" | "general_employment";
export type DeliveryChannel = "email" | "push" | "in_app";
export type DeliveryStatus = "pending" | "sent" | "failed";
export type ConsultationThreadStatus = "open" | "closed";
export type ModeSwitchStatus = "pending" | "approved" | "rejected" | "cancelled";
export type ModeSwitchRequestMethod = "invite_link" | "supporter_email";
export type ScheduleMigrationPolicy =
  | "none"
  | "convert_am_pm"
  | "keep_personal_notifications"
  | "convert_am_pm_and_keep_custom";
export type IdempotencyStatus = "processing" | "completed" | "failed";

export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends TimestampFields {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountMode: AccountMode;
  organizationId: string;
  active: boolean;
}

export interface OrganizationDocument extends TimestampFields {
  id: string;
  name: string;
}

export interface AssignmentDocument extends TimestampFields {
  id: string;
  workerId: string;
  managerId?: string;
  supporterId?: string;
  organizationId: string;
  active: boolean;
  createdBy: string;
  updatedBy?: string;
  deactivatedBy?: string;
  deactivatedAt?: Date;
}

export interface NotificationSettingsDocument extends TimestampFields {
  userId: string;
  pushEnabled: boolean;
  mailEnabled: boolean;
  soundEnabled: boolean;
  fallbackEmail?: string;
}

export interface NotificationScheduleDocument extends TimestampFields {
  id: string;
  userId: string;
  title: string;
  type: NotificationType;
  time: string;
  dayOfWeek: number[];
  enabled: boolean;
  snoozeMinutes: number;
  repeatIntervalMinutes: number;
  repeatLimitCount: number;
  mailFallbackEnabled: boolean;
  deletedAt?: Date;
}

export interface NotificationEventDocument extends TimestampFields {
  id: string;
  scheduleId: string;
  userId: string;
  title: string;
  type: NotificationType;
  dueAt: Date;
  status: NotificationEventStatus;
  notificationCount: number;
  lastNotifiedAt?: Date;
  snoozeUntil?: Date;
}

export interface WorkerSettingsDocument extends TimestampFields {
  userId: string;
  organizationId: string;
  defaultEmploymentContext: EmploymentContext;
  allowWorkerSelectRecipients: boolean;
  requiredRecipientPolicy: string;
  consultationRequiredRecipientPolicy: string;
  transitionRecipientPolicy: string;
  notifySupporterInGeneralEmployment: boolean;
  notifyManagerInSupportedFacility: boolean;
  missedVisibilityPolicy: string;
  activeTransitionId?: string;
  soundEnabled: boolean;
  snoozeMinutes: number;
  localDraftEnabled: boolean;
  displayPreferences: Record<string, unknown>;
}

export interface ReportScheduleDocument extends TimestampFields {
  id: string;
  workerId: string;
  organizationId: string;
  type: ReportType;
  workStyle: WorkStyle;
  dayOfWeek: number[];
  time: string;
  enabled: boolean;
  createdBy: string;
  updatedBy?: string;
}

export interface ReportEventDocument extends TimestampFields {
  id: string;
  scheduleId: string;
  workerId: string;
  organizationId: string;
  type: ReportType;
  dueAt: Date;
  status: "pending" | "notified" | "reported" | "missed" | "cancelled";
  workStyle: WorkStyle;
  employmentContext: EmploymentContext;
  notificationCount: number;
  lastNotifiedAt?: Date;
  visibleToManagerAfter?: Date;
}

export interface ReportDocument extends TimestampFields {
  id: string;
  eventId: string;
  workerId: string;
  organizationId: string;
  type: ReportType;
  reportStatus: ReportStatus;
  employmentContext: EmploymentContext;
  generatedText: string;
  editedText: string;
  selectedRecipients: string[];
  excludedRecipients: string[];
  submittedAt: Date;
}

export interface ReportDeliveryDocument extends TimestampFields {
  id: string;
  reportId: string;
  workerId: string;
  recipientUserId: string;
  channel: DeliveryChannel;
  destination: string;
  status: DeliveryStatus;
  errorMessage?: string;
  sentAt?: Date;
  retryCount: number;
}

export interface NotificationLogDocument {
  id: string;
  userId: string;
  eventId: string;
  accountMode: AccountMode;
  notificationType: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  errorMessage?: string;
  sentAt?: Date;
  clickedAt?: Date;
  createdAt: Date;
}

export interface ConsultationThreadDocument extends TimestampFields {
  id: string;
  reportId: string;
  workerId: string;
  organizationId: string;
  status: ConsultationThreadStatus;
  closedBy?: string;
  closedAt?: Date;
}

export interface ReportReplyDocument {
  id: string;
  threadId: string;
  reportId: string;
  senderId: string;
  senderRole: UserRole;
  body: string;
  createdAt: Date;
}

export interface AuditLogDocument {
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
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface ModeSwitchRequestDocument extends TimestampFields {
  id: string;
  userId: string;
  fromMode: AccountMode;
  toMode: AccountMode;
  requestMethod: ModeSwitchRequestMethod;
  organizationId: string;
  requestedBy: string;
  requestedSupporterEmail?: string;
  requestedSupporterId?: string;
  inviteTokenId?: string;
  desiredEmploymentContext: EmploymentContext;
  message?: string;
  inheritNotificationSchedules: boolean;
  scheduleMigrationPolicy: ScheduleMigrationPolicy;
  managerId?: string;
  supporterId?: string;
  status: ModeSwitchStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComment?: string;
}

export interface IdempotencyKeyDocument {
  id: string;
  organizationId: string;
  userId: string;
  apiName: string;
  key: string;
  requestHash: string;
  response?: Record<string, unknown>;
  status: IdempotencyStatus;
  createdAt: Date;
  expiresAt: Date;
}

export const collectionNames = [
  "users",
  "organizations",
  "assignments",
  "notificationSettings",
  "notificationSchedules",
  "notificationEvents",
  "workerSettings",
  "reportSchedules",
  "reportEvents",
  "reports",
  "reportDeliveries",
  "notificationLogs",
  "consultationThreads",
  "reportReplies",
  "auditLogs",
  "modeSwitchRequests",
  "idempotencyKeys"
] as const;

export type CollectionName = typeof collectionNames[number];
