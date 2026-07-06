const assert = require("node:assert/strict");
const fs = require("node:fs");
const { after, before, beforeEach, test } = require("node:test");
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  setDoc
} = require("firebase/firestore");

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "horen-check-rules-test",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

test("worker can read own user profile but cannot write it directly", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users/worker-1"), {
      name: "Worker",
      email: "worker@example.com"
    });
  });

  const workerDb = testEnv.authenticatedContext("worker-1").firestore();

  await assertSucceeds(getDoc(doc(workerDb, "users/worker-1")));
  await assertFails(getDoc(doc(workerDb, "users/worker-2")));
  await assertFails(setDoc(doc(workerDb, "users/worker-1"), {
    name: "Changed"
  }));
});

test("worker can read own notification resources only", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "notificationSchedules/schedule-1"), {
      userId: "worker-1",
      title: "AM開始報告の時間です"
    });
    await setDoc(doc(db, "notificationSchedules/schedule-2"), {
      userId: "worker-2",
      title: "別ユーザー"
    });
    await setDoc(doc(db, "notificationEvents/event-1"), {
      userId: "worker-1",
      status: "pending"
    });
  });

  const workerDb = testEnv.authenticatedContext("worker-1").firestore();

  await assertSucceeds(getDoc(doc(workerDb, "notificationSchedules/schedule-1")));
  await assertFails(getDoc(doc(workerDb, "notificationSchedules/schedule-2")));
  await assertSucceeds(getDoc(doc(workerDb, "notificationEvents/event-1")));
});

test("reports are readable by the worker only and never directly writable", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "reports/report-1"), {
      workerId: "worker-1",
      editedText: "おはようございます。"
    });
  });

  const workerDb = testEnv.authenticatedContext("worker-1").firestore();
  const otherDb = testEnv.authenticatedContext("worker-2").firestore();

  await assertSucceeds(getDoc(doc(workerDb, "reports/report-1")));
  await assertFails(getDoc(doc(otherDb, "reports/report-1")));
  await assertFails(setDoc(doc(workerDb, "reports/report-2"), {
    workerId: "worker-1"
  }));
});

test("unknown collections are denied by default", async () => {
  const workerDb = testEnv.authenticatedContext("worker-1").firestore();

  await assertFails(getDoc(doc(workerDb, "auditLogs/log-1")));
  await assertFails(setDoc(doc(workerDb, "auditLogs/log-1"), {
    action: "report_viewed"
  }));
  assert.ok(true);
});
