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
import { NotificationScheduleDocument } from "./domain/firestoreModels";

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
