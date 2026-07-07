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
  setDoc,
  updateDoc
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

test("worker can read own notification settings but cannot write notification logs", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "notificationSettings/worker-1"), {
      userId: "worker-1",
      pushEnabled: true,
      mailEnabled: true
    });
    await setDoc(doc(db, "notificationSettings/worker-2"), {
      userId: "worker-2",
      pushEnabled: true,
      mailEnabled: true
    });
  });

  const workerDb = testEnv.authenticatedContext("worker-1").firestore();

  await assertSucceeds(getDoc(doc(workerDb, "notificationSettings/worker-1")));
  await assertFails(getDoc(doc(workerDb, "notificationSettings/worker-2")));
  await assertFails(setDoc(doc(workerDb, "notificationLogs/log-1"), {
    userId: "worker-1"
  }));
});

test("report support roles can read assigned worker operational records but not report body", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "assignments/worker-1"), {
      workerId: "worker-1",
      managerId: "manager-1",
      supporterId: "supporter-1",
      organizationId: "org-1",
      active: true
    });
    await setDoc(doc(db, "workerSettings/worker-1"), {
      userId: "worker-1",
      organizationId: "org-1"
    });
    await setDoc(doc(db, "reportEvents/event-1"), {
      workerId: "worker-1",
      organizationId: "org-1",
      status: "pending"
    });
    await setDoc(doc(db, "reports/report-1"), {
      workerId: "worker-1",
      organizationId: "org-1",
      editedText: "本文"
    });
  });

  const managerDb = testEnv.authenticatedContext("manager-1").firestore();
  const supporterDb = testEnv.authenticatedContext("supporter-1").firestore();
  const unrelatedDb = testEnv.authenticatedContext("manager-2").firestore();

  await assertSucceeds(getDoc(doc(managerDb, "assignments/worker-1")));
  await assertSucceeds(getDoc(doc(managerDb, "workerSettings/worker-1")));
  await assertSucceeds(getDoc(doc(managerDb, "reportEvents/event-1")));
  await assertFails(getDoc(doc(managerDb, "reports/report-1")));

  await assertSucceeds(getDoc(doc(supporterDb, "assignments/worker-1")));
  await assertSucceeds(getDoc(doc(supporterDb, "workerSettings/worker-1")));
  await assertSucceeds(getDoc(doc(supporterDb, "reportEvents/event-1")));
  await assertFails(getDoc(doc(supporterDb, "reports/report-1")));

  await assertFails(getDoc(doc(unrelatedDb, "workerSettings/worker-1")));
  await assertFails(getDoc(doc(unrelatedDb, "reportEvents/event-1")));
});

test("admin can read admin collections but cannot write protected records directly", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users/admin-1"), {
      role: "admin",
      organizationId: "org-1"
    });
    await setDoc(doc(db, "users/worker-1"), {
      role: "worker",
      organizationId: "org-1"
    });
    await setDoc(doc(db, "assignments/worker-1"), {
      workerId: "worker-1",
      managerId: "manager-1",
      organizationId: "org-1",
      active: true
    });
    await setDoc(doc(db, "reportDeliveries/delivery-1"), {
      workerId: "worker-1",
      reportId: "report-1",
      status: "failed"
    });
    await setDoc(doc(db, "auditLogs/log-1"), {
      organizationId: "org-1",
      action: "role_changed"
    });
  });

  const adminDb = testEnv.authenticatedContext("admin-1").firestore();

  await assertSucceeds(getDoc(doc(adminDb, "users/worker-1")));
  await assertSucceeds(getDoc(doc(adminDb, "assignments/worker-1")));
  await assertSucceeds(getDoc(doc(adminDb, "reportDeliveries/delivery-1")));
  await assertSucceeds(getDoc(doc(adminDb, "auditLogs/log-1")));
  await assertFails(updateDoc(doc(adminDb, "users/worker-1"), {
    role: "manager"
  }));
  await assertFails(setDoc(doc(adminDb, "auditLogs/log-2"), {
    action: "manual_write"
  }));
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

test("worker can read own report events, worker settings, and assignment", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "assignments/worker-1"), {
      workerId: "worker-1",
      managerId: "manager-1",
      organizationId: "org-1",
      active: true
    });
    await setDoc(doc(db, "workerSettings/worker-1"), {
      userId: "worker-1",
      organizationId: "org-1"
    });
    await setDoc(doc(db, "reportEvents/event-1"), {
      workerId: "worker-1",
      organizationId: "org-1"
    });
    await setDoc(doc(db, "reportEvents/event-2"), {
      workerId: "worker-2",
      organizationId: "org-1"
    });
  });

  const workerDb = testEnv.authenticatedContext("worker-1").firestore();

  await assertSucceeds(getDoc(doc(workerDb, "assignments/worker-1")));
  await assertSucceeds(getDoc(doc(workerDb, "workerSettings/worker-1")));
  await assertSucceeds(getDoc(doc(workerDb, "reportEvents/event-1")));
  await assertFails(getDoc(doc(workerDb, "reportEvents/event-2")));
});

test("unknown collections are denied by default", async () => {
  const workerDb = testEnv.authenticatedContext("worker-1").firestore();

  await assertFails(getDoc(doc(workerDb, "auditLogs/log-1")));
  await assertFails(setDoc(doc(workerDb, "auditLogs/log-1"), {
    action: "report_viewed"
  }));
  assert.ok(true);
});
