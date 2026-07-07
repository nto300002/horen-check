import {
  AssignmentDocument,
  EmploymentContext,
  WorkerSettingsDocument
} from "../domain/firestoreModels";

export type RecipientPolicy =
  | "initial_recipients"
  | "manager"
  | "supporter"
  | "manager_and_supporter"
  | "none";

export interface RecipientTransition {
  id: string;
  status: "planned" | "active" | "completed" | "cancelled";
}

export interface ResolveRecipientsInput {
  workerSettings: WorkerSettingsDocument;
  assignment: AssignmentDocument;
  employmentContext: EmploymentContext;
  transition?: RecipientTransition;
  workerSelectedRecipients?: string[];
  workerExcludedRecipients?: string[];
}

export interface ResolvedRecipients {
  initialRecipients: string[];
  allowedRecipients: string[];
  requiredRecipients: string[];
  selectedRecipients: string[];
  excludedRecipients: string[];
  reportRecipientFields: {
    selectedRecipients: string[];
    excludedRecipients: string[];
  };
}

export class RecipientResolutionError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly missingRecipients: string[] = []
  ) {
    super(message);
    this.name = "RecipientResolutionError";
  }
}

function unique(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => value !== undefined && value.length > 0))];
}

function recipientsForPolicy(
  policy: RecipientPolicy,
  assignment: AssignmentDocument,
  initialRecipients: string[]
): string[] {
  if (policy === "none") {
    return [];
  }
  if (policy === "initial_recipients") {
    return initialRecipients;
  }
  if (policy === "manager") {
    return unique([assignment.managerId]);
  }
  if (policy === "supporter") {
    return unique([assignment.supporterId]);
  }
  return unique([assignment.managerId, assignment.supporterId]);
}

function defaultInitialRecipients(
  employmentContext: EmploymentContext,
  settings: WorkerSettingsDocument,
  assignment: AssignmentDocument
): string[] {
  if (employmentContext === "supported_facility") {
    return unique([
      assignment.supporterId,
      settings.notifyManagerInSupportedFacility ? assignment.managerId : undefined
    ]);
  }

  return unique([
    assignment.managerId,
    settings.notifySupporterInGeneralEmployment ? assignment.supporterId : undefined
  ]);
}

function isActiveTransition(input: ResolveRecipientsInput): boolean {
  return input.workerSettings.activeTransitionId !== undefined
    && input.transition?.id === input.workerSettings.activeTransitionId
    && input.transition.status === "active";
}

function assertAllowed(recipients: string[], allowedRecipients: string[]): void {
  const notAllowed = recipients.filter((recipient) => !allowedRecipients.includes(recipient));
  if (notAllowed.length > 0) {
    throw new RecipientResolutionError(
      "RECIPIENT_NOT_ALLOWED",
      `recipient is not allowed: ${notAllowed.join(", ")}`
    );
  }
}

function orderRecipients(
  recipients: string[],
  primaryOrder: string[],
  fallbackOrder: string[]
): string[] {
  const requested = new Set(recipients);
  return unique([...primaryOrder, ...fallbackOrder]).filter((recipient) => requested.has(recipient));
}

export function resolveRecipients(input: ResolveRecipientsInput): ResolvedRecipients {
  if (!input.assignment.active) {
    throw new RecipientResolutionError("ASSIGNMENT_INACTIVE", "assignment is inactive");
  }

  const allowedRecipients = unique([input.assignment.managerId, input.assignment.supporterId]);
  const baseInitialRecipients = defaultInitialRecipients(
    input.employmentContext,
    input.workerSettings,
    input.assignment
  );
  const initialRecipients = isActiveTransition(input)
    ? recipientsForPolicy(
      input.workerSettings.transitionRecipientPolicy as RecipientPolicy,
      input.assignment,
      baseInitialRecipients
    )
    : baseInitialRecipients;

  const requiredRecipients = recipientsForPolicy(
    (isActiveTransition(input)
      ? input.workerSettings.transitionRecipientPolicy
      : input.workerSettings.requiredRecipientPolicy) as RecipientPolicy,
    input.assignment,
    initialRecipients
  );

  const requestedSelected = input.workerSelectedRecipients === undefined
    ? initialRecipients
    : unique(input.workerSelectedRecipients);
  const requestedExcluded = unique(input.workerExcludedRecipients ?? []);

  if (!input.workerSettings.allowWorkerSelectRecipients
    && (input.workerSelectedRecipients !== undefined || requestedExcluded.length > 0)) {
    throw new RecipientResolutionError(
      "RECIPIENT_SELECTION_NOT_ALLOWED",
      "worker recipient selection is disabled"
    );
  }

  assertAllowed(requestedSelected, allowedRecipients);
  assertAllowed(requestedExcluded, initialRecipients);

  const selectedRecipients = orderRecipients(requestedSelected.filter(
    (recipient) => !requestedExcluded.includes(recipient)
  ), initialRecipients, allowedRecipients);
  const excludedRecipients = initialRecipients.filter(
    (recipient) => requestedExcluded.includes(recipient) && !selectedRecipients.includes(recipient)
  );

  return {
    initialRecipients,
    allowedRecipients,
    requiredRecipients,
    selectedRecipients,
    excludedRecipients,
    reportRecipientFields: {
      selectedRecipients,
      excludedRecipients
    }
  };
}

export function validateRequiredRecipients(resolved: ResolvedRecipients): void {
  const missingRecipients = resolved.requiredRecipients.filter(
    (recipient) => !resolved.selectedRecipients.includes(recipient)
  );
  if (missingRecipients.length > 0) {
    throw new RecipientResolutionError(
      "REQUIRED_RECIPIENT_MISSING",
      `required recipient is missing: ${missingRecipients.join(", ")}`,
      missingRecipients
    );
  }
}
