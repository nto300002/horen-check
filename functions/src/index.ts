import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import {
  acceptInvitationDocuments,
  AdminUserManagementError,
  assignUserDocuments,
  deactivateAssignmentDocuments,
  deactivateUserDocuments,
  inviteUserDocuments,
  updateUserRoleDocuments
} from "./usecase/adminUserManagement";
import { createNotificationUserProfileDocuments } from "./usecase/createNotificationUserProfile";
import {
  createNotificationScheduleDocument,
  deleteNotificationScheduleDocument,
  NotificationScheduleError,
  updateNotificationScheduleDocument
} from "./usecase/manageNotificationSchedule";
import {
  AssignmentDocument,
  IdempotencyKeyDocument,
  InvitationDocument,
  NotificationEventDocument,
  NotificationLogDocument,
  NotificationScheduleDocument,
  NotificationSettingsDocument,
  ReportDeliveryDocument,
  ReportCorrectionDocument,
  ReportDocument,
  ReportEventDocument,
  ReportScheduleDocument,
  UserDocument,
  UserRole,
  EmploymentContext,
  WorkerSettingsDocument
} from "./domain/firestoreModels";
import {
  cancelNotificationEventDocument,
  generateDailyNotificationEventDocuments,
  listRecentNotificationLogs,
  NotificationEventError,
  registerFcmTokenDocument,
  sendDueNotificationReminders,
  snoozeNotificationEventDocument,
  unregisterFcmTokenDocument,
  updateNotificationSettingsDocument
} from "./usecase/manageNotificationEvent";
import {
  RecipientResolutionError,
  RecipientTransition,
  resolveRecipients,
  validateRequiredRecipients
} from "./usecase/recipientResolution";
import {
  ReportScheduleError,
  updateReportScheduleDocument
} from "./usecase/manageReportSchedule";
import {
  generateDailyReportEventDocuments,
  sendDueReportReminders
} from "./usecase/manageReportEvent";
import {
  retryReportDeliveryDocument,
  submitReportDocuments,
  SubmitReportError
} from "./usecase/submitReport";
import {
  createReportCorrectionDocument,
  listRecentWorkerReports,
  listReportCorrections,
  ReportHistoryError
} from "./usecase/manageReportHistory";

if (getApps().length === 0) {
  initializeApp();
}

export const api = onRequest(async (request, response) => {
  if (request.path === "/health") {
    response.json({
      service: "functions-api",
      status: "ok"
    });
    return;
  }

  if (request.method === "POST" && request.path === "/createNotificationUserProfile") {
    try {
      const result = createNotificationUserProfileDocuments({
        uid: String(request.body?.uid ?? ""),
        name: String(request.body?.name ?? ""),
        email: String(request.body?.email ?? ""),
        organizationId: request.body?.organizationId,
        fallbackEmail: request.body?.fallbackEmail
      });

      const db = getFirestore();
      const batch = db.batch();

      batch.set(db.collection("users").doc(result.user.id), result.user);
      batch.set(
        db.collection("notificationSettings").doc(result.notificationSettings.userId),
        result.notificationSettings
      );
      for (const schedule of result.notificationSchedules) {
        batch.set(db.collection("notificationSchedules").doc(schedule.id), schedule);
      }
      await batch.commit();

      response.json({
        status: "ok",
        user: result.user,
        notificationSettings: result.notificationSettings,
        notificationSchedules: result.notificationSchedules
      });
    } catch (error) {
      response.status(400).json({
        error: "invalid_argument",
        message: error instanceof Error ? error.message : "Invalid request"
      });
    }
    return;
  }

  if (request.method === "POST" && request.path === "/createNotificationSchedule") {
    try {
      const db = getFirestore();
      const scheduleRef = db.collection("notificationSchedules").doc();
      const userId = String(request.body?.userId ?? "");
      const existingCustomSchedulesSnapshot = await db
        .collection("notificationSchedules")
        .where("userId", "==", userId)
        .where("type", "==", "CUSTOM")
        .get();
      const existingCustomSchedules = existingCustomSchedulesSnapshot.docs.map(
        (doc) => doc.data() as NotificationScheduleDocument
      );

      const schedule = createNotificationScheduleDocument({
        id: scheduleRef.id,
        userId,
        title: String(request.body?.title ?? ""),
        time: String(request.body?.time ?? ""),
        dayOfWeek: Array.isArray(request.body?.dayOfWeek) ? request.body.dayOfWeek : [],
        enabled: request.body?.enabled,
        snoozeMinutes: request.body?.snoozeMinutes,
        repeatIntervalMinutes: request.body?.repeatIntervalMinutes,
        repeatLimitCount: request.body?.repeatLimitCount,
        mailFallbackEnabled: request.body?.mailFallbackEnabled,
        existingCustomSchedules
      });

      await scheduleRef.set(schedule);

      response.json({
        status: "ok",
        notificationSchedule: schedule
      });
    } catch (error) {
      writeScheduleError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/updateNotificationSchedule") {
    try {
      const db = getFirestore();
      const scheduleId = String(request.body?.scheduleId ?? "");
      const scheduleRef = db.collection("notificationSchedules").doc(scheduleId);
      const snapshot = await scheduleRef.get();
      if (!snapshot.exists) {
        throw new NotificationScheduleError(
          "NOTIFICATION_SCHEDULE_NOT_FOUND",
          "notification schedule was not found"
        );
      }

      const schedule = updateNotificationScheduleDocument({
        existingSchedule: snapshot.data() as NotificationScheduleDocument,
        patch: request.body?.patch ?? {}
      });

      await scheduleRef.set(schedule);

      response.json({
        status: "ok",
        notificationSchedule: schedule
      });
    } catch (error) {
      writeScheduleError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/deleteNotificationSchedule") {
    try {
      const db = getFirestore();
      const scheduleId = String(request.body?.scheduleId ?? "");
      const scheduleRef = db.collection("notificationSchedules").doc(scheduleId);
      const snapshot = await scheduleRef.get();
      if (!snapshot.exists) {
        throw new NotificationScheduleError(
          "NOTIFICATION_SCHEDULE_NOT_FOUND",
          "notification schedule was not found"
        );
      }

      const schedule = deleteNotificationScheduleDocument({
        existingSchedule: snapshot.data() as NotificationScheduleDocument
      });

      await scheduleRef.set(schedule);

      response.json({
        status: "ok",
        notificationSchedule: schedule
      });
    } catch (error) {
      writeScheduleError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/generateDailyNotificationEvents") {
    try {
      const db = getFirestore();
      const targetDate = request.body?.targetDate === undefined
        ? new Date()
        : new Date(String(request.body.targetDate));
      const [schedulesSnapshot, eventsSnapshot] = await Promise.all([
        db.collection("notificationSchedules").get(),
        db.collection("notificationEvents").get()
      ]);
      const events = generateDailyNotificationEventDocuments({
        schedules: schedulesSnapshot.docs.map((doc) => normalizeSchedule(doc.data())),
        existingEvents: eventsSnapshot.docs.map((doc) => normalizeEvent(doc.data())),
        targetDate
      });

      const batch = db.batch();
      for (const event of events) {
        batch.set(db.collection("notificationEvents").doc(event.id), event);
      }
      await batch.commit();

      response.json({
        status: "ok",
        notificationEvents: events
      });
    } catch (error) {
      writeNotificationEventError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/sendDueNotificationReminders") {
    try {
      const db = getFirestore();
      const now = request.body?.now === undefined ? new Date() : new Date(String(request.body.now));
      const [eventsSnapshot, schedulesSnapshot, settingsSnapshot] = await Promise.all([
        db.collection("notificationEvents").get(),
        db.collection("notificationSchedules").get(),
        db.collection("notificationSettings").get()
      ]);
      const schedulesById = Object.fromEntries(
        schedulesSnapshot.docs.map((doc) => {
          const schedule = normalizeSchedule(doc.data());
          return [schedule.id, schedule];
        })
      );
      const settingsByUserId = Object.fromEntries(
        settingsSnapshot.docs.map((doc) => {
          const settings = normalizeSettings(doc.data());
          return [settings.userId, settings];
        })
      );

      const result = await sendDueNotificationReminders({
        events: eventsSnapshot.docs.map((doc) => normalizeEvent(doc.data())),
        schedulesById,
        settingsByUserId,
        now,
        pushSender: async () => undefined,
        mailer: async () => undefined
      });

      const batch = db.batch();
      for (const event of result.events) {
        batch.set(db.collection("notificationEvents").doc(event.id), event);
      }
      for (const log of result.logs) {
        batch.set(db.collection("notificationLogs").doc(log.id), log);
      }
      await batch.commit();

      response.json({
        status: "ok",
        notificationEvents: result.events,
        notificationLogs: result.logs
      });
    } catch (error) {
      writeNotificationEventError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/snoozeNotificationEvent") {
    try {
      const db = getFirestore();
      const eventId = String(request.body?.eventId ?? "");
      const eventRef = db.collection("notificationEvents").doc(eventId);
      const eventSnapshot = await eventRef.get();
      if (!eventSnapshot.exists) {
        throw new NotificationEventError(
          "NOTIFICATION_EVENT_NOT_FOUND",
          "notification event was not found"
        );
      }
      const event = normalizeEvent(eventSnapshot.data() ?? {});
      const scheduleSnapshot = await db.collection("notificationSchedules").doc(event.scheduleId).get();
      if (!scheduleSnapshot.exists) {
        throw new NotificationEventError(
          "NOTIFICATION_SCHEDULE_NOT_FOUND",
          "notification schedule was not found"
        );
      }

      const updated = snoozeNotificationEventDocument({
        existingEvent: event,
        schedule: normalizeSchedule(scheduleSnapshot.data() ?? {}),
        now: request.body?.now === undefined ? new Date() : new Date(String(request.body.now))
      });
      await eventRef.set(updated);

      response.json({
        status: "ok",
        notificationEvent: updated
      });
    } catch (error) {
      writeNotificationEventError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/cancelNotificationEvent") {
    try {
      const db = getFirestore();
      const eventId = String(request.body?.eventId ?? "");
      const eventRef = db.collection("notificationEvents").doc(eventId);
      const snapshot = await eventRef.get();
      if (!snapshot.exists) {
        throw new NotificationEventError(
          "NOTIFICATION_EVENT_NOT_FOUND",
          "notification event was not found"
        );
      }

      const updated = cancelNotificationEventDocument({
        existingEvent: normalizeEvent(snapshot.data() ?? {})
      });
      await eventRef.set(updated);

      response.json({
        status: "ok",
        notificationEvent: updated
      });
    } catch (error) {
      writeNotificationEventError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/listNotificationLogs") {
    try {
      const db = getFirestore();
      const userId = String(request.query.userId ?? "");
      const logsSnapshot = await db.collection("notificationLogs")
        .where("userId", "==", userId)
        .get();
      const logs = listRecentNotificationLogs({
        logs: logsSnapshot.docs.map((doc) => normalizeLog(doc.data())),
        userId,
        now: new Date()
      });

      response.json({
        status: "ok",
        notificationLogs: logs
      });
    } catch (error) {
      writeNotificationEventError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/registerFcmToken") {
    try {
      const db = getFirestore();
      const userId = String(request.body?.userId ?? "");
      const settingsRef = db.collection("notificationSettings").doc(userId);
      const snapshot = await settingsRef.get();
      const settings = registerFcmTokenDocument({
        existingSettings: normalizeSettings(snapshot.data() ?? {
          userId,
          pushEnabled: false,
          mailEnabled: true,
          soundEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        fcmToken: String(request.body?.fcmToken ?? "")
      });
      await settingsRef.set(settings);

      response.json({
        status: "ok",
        notificationSettings: settings
      });
    } catch (error) {
      writeNotificationEventError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/unregisterFcmToken") {
    try {
      const db = getFirestore();
      const userId = String(request.body?.userId ?? "");
      const settingsRef = db.collection("notificationSettings").doc(userId);
      const snapshot = await settingsRef.get();
      const settings = unregisterFcmTokenDocument({
        existingSettings: normalizeSettings(snapshot.data() ?? {
          userId,
          pushEnabled: false,
          mailEnabled: true,
          soundEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });
      await settingsRef.set(settings);

      response.json({
        status: "ok",
        notificationSettings: settings
      });
    } catch (error) {
      writeNotificationEventError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/updateNotificationSettings") {
    try {
      const db = getFirestore();
      const userId = String(request.body?.userId ?? "");
      const settingsRef = db.collection("notificationSettings").doc(userId);
      const snapshot = await settingsRef.get();
      const settings = updateNotificationSettingsDocument({
        existingSettings: normalizeSettings(snapshot.data() ?? {
          userId,
          pushEnabled: false,
          mailEnabled: true,
          soundEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        patch: request.body?.patch ?? {}
      });
      await settingsRef.set(settings);

      response.json({
        status: "ok",
        notificationSettings: settings
      });
    } catch (error) {
      writeNotificationEventError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/resolveRecipients") {
    try {
      const result = await resolveRecipientsFromRequest(request.body ?? {});
      response.json({
        status: "ok",
        recipients: result
      });
    } catch (error) {
      writeRecipientResolutionError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/validateRequiredRecipients") {
    try {
      const result = await resolveRecipientsFromRequest(request.body ?? {});
      validateRequiredRecipients(result);
      response.json({
        status: "ok",
        recipients: result
      });
    } catch (error) {
      writeRecipientResolutionError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/updateReportSchedule") {
    try {
      const db = getFirestore();
      const workerId = String(request.body?.workerId ?? "");
      const type = String(request.body?.type ?? request.body?.patch?.type ?? "AM_START");
      const scheduleId = String(request.body?.scheduleId ?? `${workerId}_${type}`);
      const scheduleRef = db.collection("reportSchedules").doc(scheduleId);
      const snapshot = await scheduleRef.get();
      const patch = {
        type,
        ...(request.body?.patch ?? {})
      };
      const schedule = updateReportScheduleDocument({
        id: scheduleId,
        workerId,
        organizationId: String(request.body?.organizationId ?? ""),
        actorId: String(request.body?.actorId ?? ""),
        actorRole: String(request.body?.actorRole ?? "") as UserRole,
        existingSchedule: snapshot.exists ? normalizeReportSchedule(snapshot.data() ?? {}) : undefined,
        patch
      });

      await scheduleRef.set(schedule);

      response.json({
        status: "ok",
        reportSchedule: schedule
      });
    } catch (error) {
      writeReportScheduleError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/generateDailyReportEvents") {
    try {
      const db = getFirestore();
      const targetDate = request.body?.targetDate === undefined
        ? new Date()
        : new Date(String(request.body.targetDate));
      const [schedulesSnapshot, eventsSnapshot, workerSettingsSnapshot] = await Promise.all([
        db.collection("reportSchedules").get(),
        db.collection("reportEvents").get(),
        db.collection("workerSettings").get()
      ]);
      const workerSettingsByWorkerId = Object.fromEntries(
        workerSettingsSnapshot.docs.map((doc) => {
          const settings = normalizeWorkerSettings(doc.data());
          return [settings.userId, settings];
        })
      );
      const events = generateDailyReportEventDocuments({
        schedules: schedulesSnapshot.docs.map((doc) => normalizeReportSchedule(doc.data())),
        existingEvents: eventsSnapshot.docs.map((doc) => normalizeReportEvent(doc.data())),
        workerSettingsByWorkerId,
        targetDate
      });

      const batch = db.batch();
      for (const event of events) {
        batch.set(db.collection("reportEvents").doc(event.id), event);
      }
      await batch.commit();

      response.json({
        status: "ok",
        reportEvents: events
      });
    } catch (error) {
      writeReportScheduleError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/sendDueReportReminders") {
    try {
      const db = getFirestore();
      const now = request.body?.now === undefined ? new Date() : new Date(String(request.body.now));
      const [eventsSnapshot, settingsSnapshot] = await Promise.all([
        db.collection("reportEvents").get(),
        db.collection("notificationSettings").get()
      ]);
      const settingsByUserId = Object.fromEntries(
        settingsSnapshot.docs.map((doc) => {
          const settings = normalizeSettings(doc.data());
          return [settings.userId, settings];
        })
      );
      const result = await sendDueReportReminders({
        events: eventsSnapshot.docs.map((doc) => normalizeReportEvent(doc.data())),
        settingsByUserId,
        now,
        pushSender: async () => undefined
      });

      const batch = db.batch();
      for (const event of result.events) {
        batch.set(db.collection("reportEvents").doc(event.id), event);
      }
      for (const log of result.logs) {
        batch.set(db.collection("notificationLogs").doc(log.id), log);
      }
      await batch.commit();

      response.json({
        status: "ok",
        reportEvents: result.events,
        notificationLogs: result.logs
      });
    } catch (error) {
      writeReportScheduleError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/submitReport") {
    try {
      const db = getFirestore();
      const workerId = String(request.body?.workerId ?? "");
      const eventId = String(request.body?.eventId ?? "");
      const idempotencyKey = String(request.body?.idempotencyKey ?? "");
      const eventRef = db.collection("reportEvents").doc(eventId);
      const eventSnapshot = await eventRef.get();
      if (!eventSnapshot.exists) {
        throw new SubmitReportError("REPORT_EVENT_NOT_FOUND", "report event was not found");
      }
      const event = normalizeReportEvent(eventSnapshot.data() ?? {});
      const reportRef = db.collection("reports").doc(String(request.body?.reportId ?? db.collection("reports").doc().id));
      const idempotencyRef = db.collection("idempotencyKeys").doc(`${workerId}_submitReport_${idempotencyKey}`);
      const [
        workerSettingsSnapshot,
        assignmentSnapshot,
        existingReportsSnapshot,
        idempotencySnapshot
      ] = await Promise.all([
        db.collection("workerSettings").doc(workerId).get(),
        db.collection("assignments").doc(workerId).get(),
        db.collection("reports").where("eventId", "==", eventId).get(),
        idempotencyRef.get()
      ]);

      if (!workerSettingsSnapshot.exists) {
        throw new SubmitReportError("WORKER_SETTINGS_NOT_FOUND", "worker settings were not found");
      }
      if (!assignmentSnapshot.exists) {
        throw new SubmitReportError("ASSIGNMENT_NOT_FOUND", "assignment was not found");
      }
      const assignment = normalizeAssignment(assignmentSnapshot.data() ?? {});
      const recipientIds = [assignment.managerId, assignment.supporterId].filter(
        (id): id is string => id !== undefined
      );
      const recipientSnapshots = await Promise.all(
        recipientIds.map((id) => db.collection("users").doc(id).get())
      );
      const recipientUsersById = Object.fromEntries(
        recipientSnapshots
          .filter((snapshot) => snapshot.exists)
          .map((snapshot) => {
            const user = normalizeUser(snapshot.data() ?? {});
            return [user.id, user];
          })
      );

      const result = await submitReportDocuments({
        reportId: reportRef.id,
        idempotencyKey,
        requestHash: JSON.stringify(request.body ?? {}),
        workerId,
        event,
        workerSettings: normalizeWorkerSettings(workerSettingsSnapshot.data() ?? {}),
        assignment,
        existingReports: existingReportsSnapshot.docs.map((doc) => normalizeReport(doc.data())),
        existingIdempotencyKey: idempotencySnapshot.exists
          ? normalizeIdempotencyKey(idempotencySnapshot.data() ?? {})
          : undefined,
        recipientUsersById,
        input: {
          todayPlan: String(request.body?.todayPlan ?? ""),
          consultation: request.body?.consultation,
          freeText: request.body?.freeText,
          editedText: request.body?.editedText,
          workerSelectedRecipients: asStringArrayOrUndefined(request.body?.workerSelectedRecipients),
          workerExcludedRecipients: asStringArrayOrUndefined(request.body?.workerExcludedRecipients)
        },
        deliverySender: async () => undefined
      });

      if (!result.idempotent && result.report !== undefined && result.reportEvent !== undefined
        && result.auditLog !== undefined) {
        const batch = db.batch();
        batch.set(reportRef, result.report);
        batch.set(eventRef, result.reportEvent);
        batch.set(idempotencyRef, result.idempotencyKey);
        batch.set(db.collection("auditLogs").doc(result.auditLog.id), result.auditLog);
        for (const delivery of result.deliveries) {
          batch.set(db.collection("reportDeliveries").doc(delivery.id), delivery);
        }
        await batch.commit();
      }

      response.json({
        status: "ok",
        idempotent: result.idempotent,
        report: result.report,
        reportEvent: result.reportEvent,
        reportDeliveries: result.deliveries,
        auditLog: result.auditLog,
        idempotencyKey: result.idempotencyKey
      });
    } catch (error) {
      writeSubmitReportError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/retryReportDelivery") {
    try {
      const db = getFirestore();
      const deliveryId = String(request.body?.deliveryId ?? "");
      const deliveryRef = db.collection("reportDeliveries").doc(deliveryId);
      const snapshot = await deliveryRef.get();
      if (!snapshot.exists) {
        throw new SubmitReportError("REPORT_DELIVERY_NOT_FOUND", "report delivery was not found");
      }
      const delivery = await retryReportDeliveryDocument({
        existingDelivery: normalizeReportDelivery(snapshot.data() ?? {}),
        deliverySender: async () => undefined
      });
      await deliveryRef.set(delivery);

      response.json({
        status: "ok",
        reportDelivery: delivery
      });
    } catch (error) {
      writeSubmitReportError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/listWorkerReports") {
    try {
      const db = getFirestore();
      const workerId = String(request.query.workerId ?? "");
      const reportsSnapshot = await db.collection("reports")
        .where("workerId", "==", workerId)
        .get();
      const reports = listRecentWorkerReports({
        reports: reportsSnapshot.docs.map((doc) => normalizeReport(doc.data())),
        workerId,
        now: new Date()
      });

      response.json({
        status: "ok",
        reports
      });
    } catch (error) {
      writeReportHistoryError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/createReportCorrection") {
    try {
      const db = getFirestore();
      const reportId = String(request.body?.reportId ?? "");
      const workerId = String(request.body?.workerId ?? "");
      const reportSnapshot = await db.collection("reports").doc(reportId).get();
      if (!reportSnapshot.exists) {
        throw new ReportHistoryError("REPORT_NOT_FOUND", "report was not found");
      }
      const correctionRef = db.collection("reportCorrections").doc();
      const result = createReportCorrectionDocument({
        id: correctionRef.id,
        report: normalizeReport(reportSnapshot.data() ?? {}),
        workerId,
        correctedText: String(request.body?.correctedText ?? ""),
        reason: String(request.body?.reason ?? "")
      });
      await correctionRef.set(result.correction);

      response.json({
        status: "ok",
        reportCorrection: result.correction,
        originalReport: result.originalReport
      });
    } catch (error) {
      writeReportHistoryError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/listReportCorrections") {
    try {
      const db = getFirestore();
      const reportId = String(request.query.reportId ?? "");
      const workerId = String(request.query.workerId ?? "");
      const correctionsSnapshot = await db.collection("reportCorrections")
        .where("reportId", "==", reportId)
        .get();
      const corrections = listReportCorrections({
        corrections: correctionsSnapshot.docs.map((doc) => normalizeReportCorrection(doc.data())),
        reportId,
        workerId
      });

      response.json({
        status: "ok",
        reportCorrections: corrections
      });
    } catch (error) {
      writeReportHistoryError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/inviteUser") {
    try {
      const db = getFirestore();
      const email = String(request.body?.email ?? "").trim().toLowerCase();
      const organizationId = String(request.body?.organizationId ?? "");
      const existingInvitationsSnapshot = await db.collection("invitations")
        .where("email", "==", email)
        .where("organizationId", "==", organizationId)
        .where("status", "==", "pending")
        .get();
      const invitationRef = db.collection("invitations").doc();
      const result = inviteUserDocuments({
        id: invitationRef.id,
        email,
        role: String(request.body?.role ?? "worker") as Exclude<UserRole, "admin">,
        organizationId,
        invitedBy: String(request.body?.actorId ?? ""),
        actorId: String(request.body?.actorId ?? ""),
        actorRole: String(request.body?.actorRole ?? "") as UserRole,
        token: String(request.body?.token ?? invitationRef.id),
        reason: request.body?.reason,
        existingInvitations: existingInvitationsSnapshot.docs.map((doc) => normalizeInvitation(doc.data()))
      });

      const batch = db.batch();
      batch.set(db.collection("invitations").doc(result.invitation.id), result.invitation);
      batch.set(db.collection("auditLogs").doc(result.auditLog.id), result.auditLog);
      await batch.commit();

      response.json({
        status: "ok",
        invitation: result.invitation,
        resendExisting: result.resendExisting
      });
    } catch (error) {
      writeAdminUserManagementError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/acceptInvitation") {
    try {
      const db = getFirestore();
      const invitationId = String(request.body?.invitationId ?? "");
      const invitationRef = db.collection("invitations").doc(invitationId);
      const snapshot = await invitationRef.get();
      if (!snapshot.exists) {
        throw new AdminUserManagementError("INVITATION_NOT_FOUND", "invitation was not found");
      }
      const result = acceptInvitationDocuments({
        invitation: normalizeInvitation(snapshot.data() ?? {}),
        uid: String(request.body?.uid ?? ""),
        name: String(request.body?.name ?? ""),
        token: String(request.body?.token ?? "")
      });

      const batch = db.batch();
      batch.set(invitationRef, result.invitation);
      batch.set(db.collection("users").doc(result.user.id), result.user);
      await batch.commit();

      response.json({
        status: "ok",
        invitation: result.invitation,
        user: result.user,
        homeRoute: result.homeRoute
      });
    } catch (error) {
      writeAdminUserManagementError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/updateUserRole") {
    try {
      const db = getFirestore();
      const userId = String(request.body?.userId ?? "");
      const userRef = db.collection("users").doc(userId);
      const snapshot = await userRef.get();
      if (!snapshot.exists) {
        throw new AdminUserManagementError("USER_NOT_FOUND", "user was not found");
      }
      const result = updateUserRoleDocuments({
        existingUser: normalizeUser(snapshot.data() ?? {}),
        nextRole: String(request.body?.nextRole ?? "worker") as UserRole,
        actorId: String(request.body?.actorId ?? ""),
        actorRole: String(request.body?.actorRole ?? "") as UserRole,
        reason: request.body?.reason
      });

      const batch = db.batch();
      batch.set(userRef, result.user);
      batch.set(db.collection("auditLogs").doc(result.auditLog.id), result.auditLog);
      await batch.commit();

      response.json({
        status: "ok",
        user: result.user,
        auditLog: result.auditLog
      });
    } catch (error) {
      writeAdminUserManagementError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/assignUser") {
    try {
      const db = getFirestore();
      const workerId = String(request.body?.workerId ?? "");
      const assignmentRef = db.collection("assignments").doc(workerId);
      const snapshot = await assignmentRef.get();
      const result = assignUserDocuments({
        workerId,
        managerId: request.body?.managerId,
        supporterId: request.body?.supporterId,
        organizationId: String(request.body?.organizationId ?? ""),
        actorId: String(request.body?.actorId ?? ""),
        actorRole: String(request.body?.actorRole ?? "") as UserRole,
        reason: request.body?.reason,
        existingAssignment: snapshot.exists ? normalizeAssignment(snapshot.data() ?? {}) : undefined
      });

      const batch = db.batch();
      batch.set(assignmentRef, result.assignment);
      batch.set(db.collection("auditLogs").doc(result.auditLog.id), result.auditLog);
      await batch.commit();

      response.json({
        status: "ok",
        assignment: result.assignment,
        auditLog: result.auditLog
      });
    } catch (error) {
      writeAdminUserManagementError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/deactivateAssignment") {
    try {
      const db = getFirestore();
      const workerId = String(request.body?.workerId ?? "");
      const assignmentRef = db.collection("assignments").doc(workerId);
      const snapshot = await assignmentRef.get();
      if (!snapshot.exists) {
        throw new AdminUserManagementError("ASSIGNMENT_NOT_FOUND", "assignment was not found");
      }
      const result = deactivateAssignmentDocuments({
        existingAssignment: normalizeAssignment(snapshot.data() ?? {}),
        actorId: String(request.body?.actorId ?? ""),
        actorRole: String(request.body?.actorRole ?? "") as UserRole,
        reason: request.body?.reason
      });

      const batch = db.batch();
      batch.set(assignmentRef, result.assignment);
      batch.set(db.collection("auditLogs").doc(result.auditLog.id), result.auditLog);
      await batch.commit();

      response.json({
        status: "ok",
        assignment: result.assignment,
        auditLog: result.auditLog
      });
    } catch (error) {
      writeAdminUserManagementError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/deactivateUser") {
    try {
      const db = getFirestore();
      const userId = String(request.body?.userId ?? "");
      const userRef = db.collection("users").doc(userId);
      const snapshot = await userRef.get();
      if (!snapshot.exists) {
        throw new AdminUserManagementError("USER_NOT_FOUND", "user was not found");
      }
      const result = deactivateUserDocuments({
        existingUser: normalizeUser(snapshot.data() ?? {}),
        actorId: String(request.body?.actorId ?? ""),
        actorRole: String(request.body?.actorRole ?? "") as UserRole,
        reason: request.body?.reason
      });

      const batch = db.batch();
      batch.set(userRef, result.user);
      batch.set(db.collection("auditLogs").doc(result.auditLog.id), result.auditLog);
      await batch.commit();
      await getAuth().updateUser(result.disableAuth.uid, {
        disabled: result.disableAuth.disabled
      });

      response.json({
        status: "ok",
        user: result.user,
        auditLog: result.auditLog,
        disableAuth: result.disableAuth
      });
    } catch (error) {
      writeAdminUserManagementError(response, error);
    }
    return;
  }

  response.status(404).json({
    error: "not_found"
  });
});

async function resolveRecipientsFromRequest(
  body: FirebaseFirestore.DocumentData
): Promise<ReturnType<typeof resolveRecipients>> {
  const db = getFirestore();
  const workerId = String(body?.workerId ?? "");
  const [settingsSnapshot, assignmentSnapshot] = await Promise.all([
    db.collection("workerSettings").doc(workerId).get(),
    db.collection("assignments").doc(workerId).get()
  ]);

  if (!settingsSnapshot.exists) {
    throw new RecipientResolutionError(
      "WORKER_SETTINGS_NOT_FOUND",
      "worker settings were not found"
    );
  }
  if (!assignmentSnapshot.exists) {
    throw new RecipientResolutionError("ASSIGNMENT_NOT_FOUND", "assignment was not found");
  }

  const workerSettings = normalizeWorkerSettings(settingsSnapshot.data() ?? {});

  return resolveRecipients({
    workerSettings,
    assignment: normalizeAssignment(assignmentSnapshot.data() ?? {}),
    employmentContext: (body?.employmentContext === undefined
      ? workerSettings.defaultEmploymentContext
      : String(body.employmentContext)) as EmploymentContext,
    transition: normalizeRecipientTransition(body?.transition),
    workerSelectedRecipients: asStringArrayOrUndefined(body?.workerSelectedRecipients),
    workerExcludedRecipients: asStringArrayOrUndefined(body?.workerExcludedRecipients)
  });
}

function writeScheduleError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof NotificationScheduleError) {
    response.status(400).json({
      error: "invalid_argument",
      errorCode: error.code,
      message: error.message
    });
    return;
  }

  response.status(400).json({
    error: "invalid_argument",
    message: error instanceof Error ? error.message : "Invalid request"
  });
}

function writeNotificationEventError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof NotificationEventError) {
    response.status(400).json({
      error: "invalid_argument",
      errorCode: error.code,
      message: error.message
    });
    return;
  }

  response.status(400).json({
    error: "invalid_argument",
    message: error instanceof Error ? error.message : "Invalid request"
  });
}

function writeRecipientResolutionError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof RecipientResolutionError) {
    response.status(400).json({
      error: "invalid_argument",
      errorCode: error.code,
      message: error.message,
      missingRecipients: error.missingRecipients
    });
    return;
  }

  response.status(400).json({
    error: "invalid_argument",
    message: error instanceof Error ? error.message : "Invalid request"
  });
}

function writeReportScheduleError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof ReportScheduleError) {
    response.status(400).json({
      error: "invalid_argument",
      errorCode: error.code,
      message: error.message
    });
    return;
  }

  response.status(400).json({
    error: "invalid_argument",
    message: error instanceof Error ? error.message : "Invalid request"
  });
}

function writeSubmitReportError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof SubmitReportError || error instanceof RecipientResolutionError) {
    response.status(400).json({
      error: "invalid_argument",
      errorCode: error.code,
      message: error.message,
      missingRecipients: error instanceof RecipientResolutionError ? error.missingRecipients : undefined
    });
    return;
  }

  response.status(400).json({
    error: "invalid_argument",
    message: error instanceof Error ? error.message : "Invalid request"
  });
}

function writeReportHistoryError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof ReportHistoryError) {
    response.status(400).json({
      error: "invalid_argument",
      errorCode: error.code,
      message: error.message
    });
    return;
  }

  response.status(400).json({
    error: "invalid_argument",
    message: error instanceof Error ? error.message : "Invalid request"
  });
}

function writeAdminUserManagementError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof AdminUserManagementError) {
    response.status(400).json({
      error: "invalid_argument",
      errorCode: error.code,
      message: error.message
    });
    return;
  }

  response.status(400).json({
    error: "invalid_argument",
    message: error instanceof Error ? error.message : "Invalid request"
  });
}

function asDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "object" && value !== null && "toDate" in value
    && typeof value.toDate === "function") {
    return value.toDate() as Date;
  }
  return new Date(String(value));
}

function asStringArrayOrUndefined(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item));
}

function normalizeRecipientTransition(value: unknown): RecipientTransition | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  const data = value as FirebaseFirestore.DocumentData;
  return {
    id: String(data.id ?? ""),
    status: String(data.status ?? "") as RecipientTransition["status"]
  };
}

function normalizeSchedule(data: FirebaseFirestore.DocumentData): NotificationScheduleDocument {
  return {
    ...data,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
    deletedAt: data.deletedAt === undefined ? undefined : asDate(data.deletedAt)
  } as NotificationScheduleDocument;
}

function normalizeEvent(data: FirebaseFirestore.DocumentData): NotificationEventDocument {
  return {
    ...data,
    dueAt: asDate(data.dueAt),
    lastNotifiedAt: data.lastNotifiedAt === undefined ? undefined : asDate(data.lastNotifiedAt),
    snoozeUntil: data.snoozeUntil === undefined ? undefined : asDate(data.snoozeUntil),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as NotificationEventDocument;
}

function normalizeSettings(data: FirebaseFirestore.DocumentData): NotificationSettingsDocument {
  return {
    ...data,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as NotificationSettingsDocument;
}

function normalizeWorkerSettings(data: FirebaseFirestore.DocumentData): WorkerSettingsDocument {
  return {
    ...data,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as WorkerSettingsDocument;
}

function normalizeReportSchedule(data: FirebaseFirestore.DocumentData): ReportScheduleDocument {
  return {
    ...data,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as ReportScheduleDocument;
}

function normalizeReportEvent(data: FirebaseFirestore.DocumentData): ReportEventDocument {
  return {
    ...data,
    dueAt: asDate(data.dueAt),
    lastNotifiedAt: data.lastNotifiedAt === undefined ? undefined : asDate(data.lastNotifiedAt),
    visibleToManagerAfter: data.visibleToManagerAfter === undefined
      ? undefined
      : asDate(data.visibleToManagerAfter),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as ReportEventDocument;
}

function normalizeReport(data: FirebaseFirestore.DocumentData): ReportDocument {
  return {
    ...data,
    submittedAt: asDate(data.submittedAt),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as ReportDocument;
}

function normalizeReportDelivery(data: FirebaseFirestore.DocumentData): ReportDeliveryDocument {
  return {
    ...data,
    sentAt: data.sentAt === undefined ? undefined : asDate(data.sentAt),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as ReportDeliveryDocument;
}

function normalizeReportCorrection(data: FirebaseFirestore.DocumentData): ReportCorrectionDocument {
  return {
    ...data,
    submittedAt: asDate(data.submittedAt),
    createdAt: asDate(data.createdAt)
  } as ReportCorrectionDocument;
}

function normalizeIdempotencyKey(data: FirebaseFirestore.DocumentData): IdempotencyKeyDocument {
  return {
    ...data,
    createdAt: asDate(data.createdAt),
    expiresAt: asDate(data.expiresAt)
  } as IdempotencyKeyDocument;
}

function normalizeLog(data: FirebaseFirestore.DocumentData): NotificationLogDocument {
  return {
    ...data,
    sentAt: data.sentAt === undefined ? undefined : asDate(data.sentAt),
    clickedAt: data.clickedAt === undefined ? undefined : asDate(data.clickedAt),
    createdAt: asDate(data.createdAt)
  } as NotificationLogDocument;
}

function normalizeInvitation(data: FirebaseFirestore.DocumentData): InvitationDocument {
  return {
    ...data,
    expiresAt: asDate(data.expiresAt),
    lastSentAt: asDate(data.lastSentAt),
    acceptedAt: data.acceptedAt === undefined ? undefined : asDate(data.acceptedAt),
    cancelledAt: data.cancelledAt === undefined ? undefined : asDate(data.cancelledAt),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as InvitationDocument;
}

function normalizeUser(data: FirebaseFirestore.DocumentData): UserDocument {
  return {
    ...data,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as UserDocument;
}

function normalizeAssignment(data: FirebaseFirestore.DocumentData): AssignmentDocument {
  return {
    ...data,
    deactivatedAt: data.deactivatedAt === undefined ? undefined : asDate(data.deactivatedAt),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as AssignmentDocument;
}
