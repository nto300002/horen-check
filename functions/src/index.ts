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
import {
  getAdminReportDetail,
  getManagerReportDetail,
  getSupporterWorkerReport,
  listAdminUsers,
  listAuditLogs,
  listManagerTodayReports,
  listSupporterWorkers,
  ReportReviewError
} from "./usecase/manageReportReview";
import {
  cancelModeSwitchRequestDocument,
  createModeSwitchRequestDocument,
  listModeSwitchRequests,
  ModeSwitchError,
  reviewModeSwitchRequestDocuments
} from "./usecase/manageModeSwitch";
import { createNotificationUserProfileDocuments } from "./usecase/createNotificationUserProfile";
import {
  createNotificationScheduleDocument,
  deleteNotificationScheduleDocument,
  NotificationScheduleError,
  updateNotificationScheduleDocument
} from "./usecase/manageNotificationSchedule";
import {
  AssignmentDocument,
  AuditLogDocument,
  IdempotencyKeyDocument,
  InvitationDocument,
  ModeSwitchRequestDocument,
  NotificationEventDocument,
  NotificationLogDocument,
  NotificationScheduleDocument,
  NotificationSettingsDocument,
  ReportDeliveryDocument,
  ConsultationThreadDocument,
  ReportCorrectionDocument,
  ReportReplyDocument,
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
import {
  closeConsultationThreadDocument,
  ConsultationThreadError,
  confirmReportReplyDocument,
  createReportReplyDocuments,
  getConsultationThreadDetail,
  listManagerConsultationThreads
} from "./usecase/manageConsultationThread";

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
          completedWork: request.body?.completedWork === undefined ? undefined : String(request.body.completedWork),
          afternoonPlan: request.body?.afternoonPlan === undefined ? undefined : String(request.body.afternoonPlan),
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
        if (result.consultationThread !== undefined) {
          batch.set(db.collection("consultationThreads").doc(result.consultationThread.id), result.consultationThread);
        }
        await batch.commit();
      }

      response.json({
        status: "ok",
        idempotent: result.idempotent,
        report: result.report,
        reportEvent: result.reportEvent,
        reportDeliveries: result.deliveries,
        consultationThread: result.consultationThread,
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

  if (request.method === "POST" && request.path === "/createReportReply") {
    try {
      const db = getFirestore();
      const threadId = String(request.body?.threadId ?? "");
      const actorId = String(request.body?.actorId ?? "");
      const actorRole = String(request.body?.actorRole ?? "") as UserRole;
      const threadRef = db.collection("consultationThreads").doc(threadId);
      const threadSnapshot = await threadRef.get();
      if (!threadSnapshot.exists) {
        throw new ConsultationThreadError("CONSULTATION_THREAD_NOT_FOUND", "consultation thread was not found");
      }
      const thread = normalizeConsultationThread(threadSnapshot.data() ?? {});
      const reportSnapshot = await db.collection("reports").doc(thread.reportId).get();
      if (!reportSnapshot.exists) {
        throw new ConsultationThreadError("REPORT_NOT_FOUND", "report was not found");
      }
      const replyRef = db.collection("reportReplies").doc(String(request.body?.replyId ?? db.collection("reportReplies").doc().id));
      const result = createReportReplyDocuments({
        replyId: replyRef.id,
        thread,
        report: normalizeReport(reportSnapshot.data() ?? {}),
        actorId,
        actorRole,
        body: String(request.body?.body ?? "")
      });
      const batch = db.batch();
      batch.set(replyRef, result.reply);
      for (const log of result.notificationLogs) {
        batch.set(db.collection("notificationLogs").doc(log.id), log);
      }
      await batch.commit();

      response.json({
        status: "ok",
        reportReply: result.reply,
        notificationLogs: result.notificationLogs
      });
    } catch (error) {
      writeConsultationThreadError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/closeConsultationThread") {
    try {
      const db = getFirestore();
      const threadId = String(request.body?.threadId ?? "");
      const threadRef = db.collection("consultationThreads").doc(threadId);
      const threadSnapshot = await threadRef.get();
      if (!threadSnapshot.exists) {
        throw new ConsultationThreadError("CONSULTATION_THREAD_NOT_FOUND", "consultation thread was not found");
      }
      const thread = normalizeConsultationThread(threadSnapshot.data() ?? {});
      const reportSnapshot = await db.collection("reports").doc(thread.reportId).get();
      if (!reportSnapshot.exists) {
        throw new ConsultationThreadError("REPORT_NOT_FOUND", "report was not found");
      }
      const updated = closeConsultationThreadDocument({
        thread,
        report: normalizeReport(reportSnapshot.data() ?? {}),
        actorId: String(request.body?.actorId ?? ""),
        actorRole: String(request.body?.actorRole ?? "") as UserRole
      });
      await threadRef.set(updated);

      response.json({
        status: "ok",
        consultationThread: updated
      });
    } catch (error) {
      writeConsultationThreadError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/confirmReportReply") {
    try {
      const db = getFirestore();
      const replyId = String(request.body?.replyId ?? "");
      const replySnapshot = await db.collection("reportReplies").doc(replyId).get();
      if (!replySnapshot.exists) {
        throw new ConsultationThreadError("REPORT_REPLY_NOT_FOUND", "report reply was not found");
      }
      const reply = normalizeReportReply(replySnapshot.data() ?? {});
      const threadSnapshot = await db.collection("consultationThreads").doc(reply.threadId).get();
      if (!threadSnapshot.exists) {
        throw new ConsultationThreadError("CONSULTATION_THREAD_NOT_FOUND", "consultation thread was not found");
      }
      const thread = normalizeConsultationThread(threadSnapshot.data() ?? {});
      const reportSnapshot = await db.collection("reports").doc(reply.reportId).get();
      if (!reportSnapshot.exists) {
        throw new ConsultationThreadError("REPORT_NOT_FOUND", "report was not found");
      }
      const result = confirmReportReplyDocument({
        thread,
        report: normalizeReport(reportSnapshot.data() ?? {}),
        reply,
        actorId: String(request.body?.actorId ?? ""),
        actorRole: String(request.body?.actorRole ?? "") as UserRole
      });
      await db.collection("auditLogs").doc(result.auditLog.id).set(result.auditLog);

      response.json({
        status: "ok",
        auditLog: result.auditLog
      });
    } catch (error) {
      writeConsultationThreadError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/listManagerConsultationThreads") {
    try {
      const db = getFirestore();
      const managerId = String(request.query.managerId ?? "");
      const [threadsSnapshot, reportsSnapshot] = await Promise.all([
        db.collection("consultationThreads").get(),
        db.collection("reports").get()
      ]);
      const threads = listManagerConsultationThreads({
        managerId,
        threads: threadsSnapshot.docs.map((doc) => normalizeConsultationThread(doc.data())),
        reports: reportsSnapshot.docs.map((doc) => normalizeReport(doc.data()))
      });

      response.json({
        status: "ok",
        consultationThreads: threads
      });
    } catch (error) {
      writeConsultationThreadError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/getConsultationThreadDetail") {
    try {
      const db = getFirestore();
      const threadId = String(request.query.threadId ?? "");
      const threadSnapshot = await db.collection("consultationThreads").doc(threadId).get();
      if (!threadSnapshot.exists) {
        throw new ConsultationThreadError("CONSULTATION_THREAD_NOT_FOUND", "consultation thread was not found");
      }
      const thread = normalizeConsultationThread(threadSnapshot.data() ?? {});
      const [reportSnapshot, repliesSnapshot] = await Promise.all([
        db.collection("reports").doc(thread.reportId).get(),
        db.collection("reportReplies").where("threadId", "==", thread.id).get()
      ]);
      if (!reportSnapshot.exists) {
        throw new ConsultationThreadError("REPORT_NOT_FOUND", "report was not found");
      }
      const detail = getConsultationThreadDetail({
        thread,
        report: normalizeReport(reportSnapshot.data() ?? {}),
        replies: repliesSnapshot.docs.map((doc) => normalizeReportReply(doc.data())),
        actorId: String(request.query.actorId ?? ""),
        actorRole: String(request.query.actorRole ?? "") as UserRole
      });

      response.json({
        status: "ok",
        consultationThread: detail
      });
    } catch (error) {
      writeConsultationThreadError(response, error);
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

  if (request.method === "GET" && request.path === "/listManagerTodayReports") {
    try {
      const db = getFirestore();
      const managerId = String(request.query.managerId ?? "");
      const targetDate = request.query.targetDate === undefined
        ? new Date()
        : new Date(String(request.query.targetDate));
      const [assignmentsSnapshot, reportsSnapshot, usersSnapshot] = await Promise.all([
        db.collection("assignments").where("managerId", "==", managerId).get(),
        db.collection("reports").get(),
        db.collection("users").get()
      ]);
      const usersById = Object.fromEntries(
        usersSnapshot.docs.map((doc) => {
          const user = normalizeUser(doc.data());
          return [user.id, user];
        })
      );
      const reports = listManagerTodayReports({
        managerId,
        reports: reportsSnapshot.docs.map((doc) => normalizeReport(doc.data())),
        assignments: assignmentsSnapshot.docs.map((doc) => normalizeAssignment(doc.data())),
        workerUsersById: usersById,
        targetDate
      });

      response.json({
        status: "ok",
        reports
      });
    } catch (error) {
      writeReportReviewError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/getManagerReportDetail") {
    try {
      const db = getFirestore();
      const managerId = String(request.query.managerId ?? "");
      const reportId = String(request.query.reportId ?? "");
      const reportSnapshot = await db.collection("reports").doc(reportId).get();
      if (!reportSnapshot.exists) {
        throw new ReportReviewError("REPORT_NOT_FOUND", "report was not found");
      }
      const report = normalizeReport(reportSnapshot.data() ?? {});
      const assignmentSnapshot = await db.collection("assignments").doc(report.workerId).get();
      if (!assignmentSnapshot.exists) {
        throw new ReportReviewError("ASSIGNMENT_NOT_FOUND", "assignment was not found");
      }
      const reportDetail = getManagerReportDetail({
        managerId,
        report,
        assignment: normalizeAssignment(assignmentSnapshot.data() ?? {})
      });

      response.json({
        status: "ok",
        report: reportDetail
      });
    } catch (error) {
      writeReportReviewError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/listSupporterWorkers") {
    try {
      const db = getFirestore();
      const supporterId = String(request.query.supporterId ?? "");
      const [assignmentsSnapshot, usersSnapshot] = await Promise.all([
        db.collection("assignments").where("supporterId", "==", supporterId).get(),
        db.collection("users").get()
      ]);
      const usersById = Object.fromEntries(
        usersSnapshot.docs.map((doc) => {
          const user = normalizeUser(doc.data());
          return [user.id, user];
        })
      );
      const workers = listSupporterWorkers({
        supporterId,
        assignments: assignmentsSnapshot.docs.map((doc) => normalizeAssignment(doc.data())),
        usersById
      });

      response.json({
        status: "ok",
        workers
      });
    } catch (error) {
      writeReportReviewError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/getSupporterWorkerReport") {
    try {
      const db = getFirestore();
      const supporterId = String(request.query.supporterId ?? "");
      const workerId = String(request.query.workerId ?? "");
      const [assignmentSnapshot, reportsSnapshot] = await Promise.all([
        db.collection("assignments").doc(workerId).get(),
        db.collection("reports").where("workerId", "==", workerId).get()
      ]);
      if (!assignmentSnapshot.exists) {
        throw new ReportReviewError("ASSIGNMENT_NOT_FOUND", "assignment was not found");
      }
      const reports = getSupporterWorkerReport({
        supporterId,
        workerId,
        reports: reportsSnapshot.docs.map((doc) => normalizeReport(doc.data())),
        assignment: normalizeAssignment(assignmentSnapshot.data() ?? {}),
        now: new Date()
      });

      response.json({
        status: "ok",
        reports
      });
    } catch (error) {
      writeReportReviewError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/listAdminUsers") {
    try {
      const db = getFirestore();
      const usersSnapshot = await db.collection("users").get();
      const users = listAdminUsers({
        users: usersSnapshot.docs.map((doc) => normalizeUser(doc.data()))
      });

      response.json({
        status: "ok",
        users
      });
    } catch (error) {
      writeReportReviewError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/listAuditLogs") {
    try {
      const db = getFirestore();
      const auditLogsSnapshot = await db.collection("auditLogs").get();
      const auditLogs = listAuditLogs({
        auditLogs: auditLogsSnapshot.docs.map((doc) => normalizeAuditLog(doc.data()))
      });

      response.json({
        status: "ok",
        auditLogs
      });
    } catch (error) {
      writeReportReviewError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/getReportForAdmin") {
    try {
      const db = getFirestore();
      const reportId = String(request.body?.reportId ?? "");
      const reportSnapshot = await db.collection("reports").doc(reportId).get();
      if (!reportSnapshot.exists) {
        throw new ReportReviewError("REPORT_NOT_FOUND", "report was not found");
      }
      const result = getAdminReportDetail({
        adminId: String(request.body?.adminId ?? ""),
        report: normalizeReport(reportSnapshot.data() ?? {}),
        reason: String(request.body?.reason ?? "")
      });
      await db.collection("auditLogs").doc(result.auditLog.id).set(result.auditLog);

      response.json({
        status: "ok",
        report: result.report,
        auditLog: result.auditLog
      });
    } catch (error) {
      writeReportReviewError(response, error);
    }
    return;
  }

  if (request.method === "GET" && request.path === "/listModeSwitchRequests") {
    try {
      const db = getFirestore();
      const requestsSnapshot = await db.collection("modeSwitchRequests").get();
      const requests = listModeSwitchRequests({
        actorRole: String(request.query.actorRole ?? "supporter") as Extract<UserRole, "supporter" | "admin">,
        actorEmail: request.query.actorEmail === undefined
          ? undefined
          : String(request.query.actorEmail),
        requests: requestsSnapshot.docs.map((doc) => normalizeModeSwitchRequest(doc.data()))
      });

      response.json({
        status: "ok",
        modeSwitchRequests: requests
      });
    } catch (error) {
      writeModeSwitchError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/createModeSwitchRequest") {
    try {
      const db = getFirestore();
      const workerId = String(request.body?.workerId ?? "");
      const workerSnapshot = await db.collection("users").doc(workerId).get();
      if (!workerSnapshot.exists) {
        throw new ModeSwitchError("WORKER_NOT_FOUND", "worker was not found");
      }
      const existingRequestsSnapshot = await db.collection("modeSwitchRequests")
        .where("userId", "==", workerId)
        .get();
      const requestRef = db.collection("modeSwitchRequests").doc();
      const result = createModeSwitchRequestDocument({
        id: requestRef.id,
        worker: normalizeUser(workerSnapshot.data() ?? {}),
        requestMethod: String(request.body?.requestMethod ?? "supporter_email") as ModeSwitchRequestDocument["requestMethod"],
        requestedSupporterEmail: request.body?.requestedSupporterEmail,
        requestedSupporterId: request.body?.requestedSupporterId,
        inviteTokenId: request.body?.inviteTokenId,
        desiredEmploymentContext: String(
          request.body?.desiredEmploymentContext ?? "supported_facility"
        ) as EmploymentContext,
        message: request.body?.message,
        inheritNotificationSchedules: request.body?.inheritNotificationSchedules ?? true,
        scheduleMigrationPolicy: String(
          request.body?.scheduleMigrationPolicy ?? "convert_am_pm"
        ) as ModeSwitchRequestDocument["scheduleMigrationPolicy"],
        managerId: request.body?.managerId,
        supporterId: request.body?.supporterId,
        existingRequests: existingRequestsSnapshot.docs.map((doc) =>
          normalizeModeSwitchRequest(doc.data())
        )
      });
      await requestRef.set(result.request);

      response.json({
        status: "ok",
        modeSwitchRequest: result.request
      });
    } catch (error) {
      writeModeSwitchError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/cancelModeSwitchRequest") {
    try {
      const db = getFirestore();
      const requestId = String(request.body?.requestId ?? "");
      const requestRef = db.collection("modeSwitchRequests").doc(requestId);
      const snapshot = await requestRef.get();
      if (!snapshot.exists) {
        throw new ModeSwitchError("MODE_SWITCH_REQUEST_NOT_FOUND", "mode switch request was not found");
      }
      const modeSwitchRequest = cancelModeSwitchRequestDocument({
        request: normalizeModeSwitchRequest(snapshot.data() ?? {}),
        workerId: String(request.body?.workerId ?? "")
      });
      await requestRef.set(modeSwitchRequest);

      response.json({
        status: "ok",
        modeSwitchRequest
      });
    } catch (error) {
      writeModeSwitchError(response, error);
    }
    return;
  }

  if (request.method === "POST" && request.path === "/reviewModeSwitchRequest") {
    try {
      const db = getFirestore();
      const requestId = String(request.body?.requestId ?? "");
      const requestRef = db.collection("modeSwitchRequests").doc(requestId);
      const requestSnapshot = await requestRef.get();
      if (!requestSnapshot.exists) {
        throw new ModeSwitchError("MODE_SWITCH_REQUEST_NOT_FOUND", "mode switch request was not found");
      }
      const modeSwitchRequest = normalizeModeSwitchRequest(requestSnapshot.data() ?? {});
      const [workerSnapshot, notificationSchedulesSnapshot] = await Promise.all([
        db.collection("users").doc(modeSwitchRequest.userId).get(),
        db.collection("notificationSchedules")
          .where("userId", "==", modeSwitchRequest.userId)
          .get()
      ]);
      if (!workerSnapshot.exists) {
        throw new ModeSwitchError("WORKER_NOT_FOUND", "worker was not found");
      }
      const result = reviewModeSwitchRequestDocuments({
        request: modeSwitchRequest,
        worker: normalizeUser(workerSnapshot.data() ?? {}),
        reviewerId: String(request.body?.reviewerId ?? ""),
        reviewerRole: String(request.body?.reviewerRole ?? "supporter") as Extract<UserRole, "supporter" | "admin">,
        decision: String(request.body?.decision ?? "approved") as "approved" | "rejected",
        managerId: request.body?.managerId,
        supporterId: request.body?.supporterId,
        reviewComment: request.body?.reviewComment,
        notificationSchedules: notificationSchedulesSnapshot.docs.map((doc) =>
          normalizeSchedule(doc.data())
        )
      });

      const batch = db.batch();
      batch.set(requestRef, result.request);
      batch.set(db.collection("users").doc(result.user.id), result.user);
      batch.set(db.collection("auditLogs").doc(result.auditLog.id), result.auditLog);
      if (result.workerSettings !== undefined) {
        batch.set(db.collection("workerSettings").doc(result.workerSettings.userId), result.workerSettings);
      }
      if (result.assignment !== undefined) {
        batch.set(db.collection("assignments").doc(result.assignment.workerId), result.assignment);
      }
      for (const reportSchedule of result.reportSchedules) {
        batch.set(db.collection("reportSchedules").doc(reportSchedule.id), reportSchedule);
      }
      await batch.commit();

      response.json({
        status: "ok",
        modeSwitchRequest: result.request,
        user: result.user,
        workerSettings: result.workerSettings,
        assignment: result.assignment,
        reportSchedules: result.reportSchedules,
        auditLog: result.auditLog
      });
    } catch (error) {
      writeModeSwitchError(response, error);
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

function writeReportReviewError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof ReportReviewError) {
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

function writeConsultationThreadError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof ConsultationThreadError) {
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

function writeModeSwitchError(
  response: Parameters<Parameters<typeof onRequest>[0]>[1],
  error: unknown
): void {
  if (error instanceof ModeSwitchError) {
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

function normalizeConsultationThread(data: FirebaseFirestore.DocumentData): ConsultationThreadDocument {
  return {
    ...data,
    closedAt: data.closedAt === undefined ? undefined : asDate(data.closedAt),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as ConsultationThreadDocument;
}

function normalizeReportReply(data: FirebaseFirestore.DocumentData): ReportReplyDocument {
  return {
    ...data,
    createdAt: asDate(data.createdAt)
  } as ReportReplyDocument;
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

function normalizeAuditLog(data: FirebaseFirestore.DocumentData): AuditLogDocument {
  return {
    ...data,
    createdAt: asDate(data.createdAt)
  } as AuditLogDocument;
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

function normalizeModeSwitchRequest(data: FirebaseFirestore.DocumentData): ModeSwitchRequestDocument {
  return {
    ...data,
    reviewedAt: data.reviewedAt === undefined ? undefined : asDate(data.reviewedAt),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt)
  } as ModeSwitchRequestDocument;
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
