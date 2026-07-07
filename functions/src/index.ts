import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { createNotificationUserProfileDocuments } from "./usecase/createNotificationUserProfile";
import {
  createNotificationScheduleDocument,
  deleteNotificationScheduleDocument,
  NotificationScheduleError,
  updateNotificationScheduleDocument
} from "./usecase/manageNotificationSchedule";
import {
  NotificationEventDocument,
  NotificationLogDocument,
  NotificationScheduleDocument,
  NotificationSettingsDocument
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

  response.status(404).json({
    error: "not_found"
  });
});

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

function normalizeLog(data: FirebaseFirestore.DocumentData): NotificationLogDocument {
  return {
    ...data,
    sentAt: data.sentAt === undefined ? undefined : asDate(data.sentAt),
    clickedAt: data.clickedAt === undefined ? undefined : asDate(data.clickedAt),
    createdAt: asDate(data.createdAt)
  } as NotificationLogDocument;
}
