import {
  APPLICANT_PROFILE_FIELDS,
  type ApplicantProfile,
} from "../types/applicantProfile";
import type { ApplicationStatus } from "../types/company";
import type {
  BackupOperationResult,
  BackupParseResult,
  CareerTrackBackupV1,
  CareerTrackDataSnapshot,
} from "../types/backup";
import {
  companyListPreferencesStorage,
  companyStorage,
  normalizeApplicantProfile,
  normalizeCompanies,
  normalizeCompanyListPreferences,
  normalizeSettings,
  profileStorage,
  settingsStorage,
} from "./storage";

const APPLICATION_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  "not_applied",
  "preparing",
  "applied",
  "document_screening",
  "document_passed",
  "first_interview_scheduled",
  "first_interview_completed",
  "second_interview_scheduled",
  "second_interview_completed",
  "final_interview_scheduled",
  "final_interview_completed",
  "casual_interview_scheduled",
  "waiting_for_reply",
  "scheduling",
  "waiting_for_result",
  "offer",
  "rejected",
  "withdrawn",
  "on_hold",
  "closed",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateProfileFields(value: unknown): value is ApplicantProfile {
  return (
    isRecord(value) &&
    APPLICANT_PROFILE_FIELDS.every(({ key }) => typeof value[key] === "string")
  );
}

function validateCompanyCore(value: unknown): string | null {
  if (!isRecord(value)) {
    return "企業データにオブジェクト以外の値があります。";
  }
  if (typeof value.id !== "string" || !value.id.trim()) {
    return "企業IDが未入力または不正です。";
  }
  if (typeof value.name !== "string" || !value.name.trim()) {
    return `企業ID「${value.id}」の会社名が未入力または不正です。`;
  }
  if (
    typeof value.applicationStatus !== "string" ||
    !APPLICATION_STATUSES.has(value.applicationStatus as ApplicationStatus)
  ) {
    return `「${value.name}」の応募状況が不正です。`;
  }
  if (typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") {
    return `「${value.name}」の登録日時または更新日時が不正です。`;
  }

  const requiredStrings = [
    "jobTitle",
    "jobUrl",
    "source",
    "employmentType",
    "location",
    "contactName",
    "applicationNotes",
    "bonus",
    "probationPeriod",
    "fixedOvertimePay",
    "trainingPeriod",
    "beginnerAssignmentExamples",
    "technologyNotes",
    "strengths",
    "concerns",
    "redFlags",
    "notes",
    "manualPriority",
  ] as const;
  if (requiredStrings.some((key) => typeof value[key] !== "string")) {
    return `「${value.name}」の基本項目に不正な値があります。`;
  }

  const requiredChoices = [
    "remoteWork",
    "relocation",
    "sideJob",
    "trainingDuringWorkHours",
    "otherWorkDuringTraining",
    "assignmentFlexibility",
    "nonDevelopmentAssignment",
    "clientSiteWork",
    "inHouseDevelopment",
    "benchSalary",
    "codeReview",
    "teamDevelopment",
    "aiUsage",
    "websiteDevelopment",
    "webAppDevelopment",
  ] as const;
  const choiceValues = new Set(["yes", "no", "partial", "unknown"]);
  if (
    requiredChoices.some(
      (key) => typeof value[key] !== "string" || !choiceValues.has(value[key]),
    )
  ) {
    return `「${value.name}」の選択項目に不正な値があります。`;
  }

  if (
    !Array.isArray(value.technologies) ||
    !value.technologies.every((technology) => typeof technology === "string") ||
    !Array.isArray(value.interviewQuestions) ||
    !Array.isArray(value.interviews) ||
    !isRecord(value.scores) ||
    typeof value.autoScore !== "number" ||
    typeof value.autoJudgment !== "string" ||
    !isRecord(value.judgmentSelection)
  ) {
    return `「${value.name}」の評価または面接データの形式が不正です。`;
  }

  if (value.interviewPreparation !== undefined) {
    const preparation = value.interviewPreparation;
    const preparationKeys = [
      "expectedQuestions",
      "talkingPoints",
      "preparationNotes",
      "askedQuestions",
      "interviewerImpression",
      "positiveReflection",
      "concernsAfterInterview",
      "nextImprovements",
    ] as const;
    if (
      !isRecord(preparation) ||
      preparationKeys.some(
        (key) =>
          preparation[key] !== undefined &&
          typeof preparation[key] !== "string",
      )
    ) {
      return `「${value.name}」の面接対策データの形式が不正です。`;
    }
  }

  const optionalStrings = [
    "appliedAt",
    "documentDeadline",
    "nextAction",
    "nextActionDate",
  ] as const;
  if (
    optionalStrings.some(
      (key) => value[key] !== undefined && typeof value[key] !== "string",
    )
  ) {
    return `「${value.name}」の日付または予定項目の形式が不正です。`;
  }

  const optionalNumbers = [
    "salaryMin",
    "salaryMax",
    "annualIncomeMin",
    "annualIncomeMax",
    "annualHolidays",
    "overtimeHours",
  ] as const;
  if (
    optionalNumbers.some(
      (key) => value[key] !== undefined && typeof value[key] !== "number",
    )
  ) {
    return `「${value.name}」の数値項目の形式が不正です。`;
  }
  return null;
}

export function readCareerTrackSnapshot():
  | { ok: true; value: CareerTrackDataSnapshot }
  | { ok: false; message: string } {
  const companies = companyStorage.read();
  const applicantProfile = profileStorage.read();
  const settings = settingsStorage.read();
  const companyListPreferences = companyListPreferencesStorage.read();

  if (!companies.ok || !applicantProfile.ok || !settings.ok || !companyListPreferences.ok) {
    return {
      ok: false,
      message: "保存データの一部を読み込めなかったため、バックアップを作成できませんでした。",
    };
  }

  return {
    ok: true,
    value: {
      companies: companies.value,
      applicantProfile: applicantProfile.value,
      settings: settings.value,
      companyListPreferences: companyListPreferences.value,
    },
  };
}

export function createCareerTrackBackup(
  snapshot: CareerTrackDataSnapshot,
  exportedAt = new Date().toISOString(),
): CareerTrackBackupV1 {
  return {
    format: "career-track-backup",
    version: 1,
    exportedAt,
    data: snapshot,
  };
}

export function createBackupFileName(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "00";
  return `career-track-backup-${part("year")}-${part("month")}-${part("day")}.json`;
}

export function downloadBackup(
  backup: CareerTrackBackupV1,
  fileName = createBackupFileName(),
): BackupOperationResult {
  try {
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "バックアップファイルを作成またはダウンロードできませんでした。",
    };
  }
}

export function parseCareerTrackBackup(text: string): BackupParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, message: "JSONの形式が正しくありません。" };
  }

  if (!isRecord(parsed) || parsed.format !== "career-track-backup") {
    return { ok: false, message: "Career Trackの正式なバックアップファイルではありません。" };
  }
  if (parsed.version !== 1) {
    return { ok: false, message: "このバックアップのバージョンには対応していません。" };
  }
  if (
    typeof parsed.exportedAt !== "string" ||
    Number.isNaN(Date.parse(parsed.exportedAt))
  ) {
    return { ok: false, message: "バックアップ日時が不正です。" };
  }
  if (!isRecord(parsed.data)) {
    return { ok: false, message: "バックアップのdata項目が不正です。" };
  }

  const rawCompanies = parsed.data.companies;
  if (!Array.isArray(rawCompanies)) {
    return { ok: false, message: "企業データが見つかりません。" };
  }
  const ids = new Set<string>();
  for (const company of rawCompanies) {
    if (!isRecord(company) || typeof company.id !== "string" || !company.id.trim()) {
      return { ok: false, message: "企業IDが未入力または不正です。" };
    }
    const id = company.id;
    if (ids.has(id)) {
      return { ok: false, message: `企業ID「${id}」が重複しています。` };
    }
    ids.add(id);
  }
  for (const company of rawCompanies) {
    const companyError = validateCompanyCore(company);
    if (companyError) {
      return { ok: false, message: companyError };
    }
  }

  if (!validateProfileFields(parsed.data.applicantProfile)) {
    return { ok: false, message: "応募者プロフィールの必須項目が不正です。" };
  }
  const companies = normalizeCompanies(rawCompanies);
  const profile = normalizeApplicantProfile(parsed.data.applicantProfile);
  const settings = normalizeSettings(parsed.data.settings);
  const preferences = normalizeCompanyListPreferences(
    parsed.data.companyListPreferences,
  );
  if (!companies.ok || !profile.ok || !settings.ok || !preferences.ok) {
    const failure = [companies, profile, settings, preferences].find(
      (result) => !result.ok,
    );
    return {
      ok: false,
      message: failure && !failure.ok ? failure.message : "保存データの形式が不正です。",
    };
  }

  return {
    ok: true,
    value: createCareerTrackBackup(
      {
        companies: companies.value,
        applicantProfile: profile.value,
        settings: settings.value,
        companyListPreferences: preferences.value,
      },
      parsed.exportedAt,
    ),
  };
}

function writeSnapshot(snapshot: CareerTrackDataSnapshot): BackupOperationResult {
  const writes = [
    companyStorage.write(snapshot.companies),
    profileStorage.write(snapshot.applicantProfile),
    settingsStorage.write(snapshot.settings),
    companyListPreferencesStorage.write(snapshot.companyListPreferences),
  ];
  return writes.every((result) => result.ok)
    ? { ok: true }
    : { ok: false, message: "保存データの書き込みに失敗しました。" };
}

function snapshotsMatch(
  expected: CareerTrackDataSnapshot,
  actual: CareerTrackDataSnapshot,
): boolean {
  return JSON.stringify(expected) === JSON.stringify(actual);
}

export interface SnapshotAccess {
  write: (snapshot: CareerTrackDataSnapshot) => BackupOperationResult;
  read: () =>
    | { ok: true; value: CareerTrackDataSnapshot }
    | { ok: false; message: string };
}

export function replaceSnapshotTransaction(
  incomingSnapshot: CareerTrackDataSnapshot,
  currentSnapshot: CareerTrackDataSnapshot,
  access: SnapshotAccess,
): BackupOperationResult {
  const writeResult = access.write(incomingSnapshot);
  const reread = writeResult.ok ? access.read() : null;
  if (
    writeResult.ok &&
    reread?.ok &&
    snapshotsMatch(incomingSnapshot, reread.value)
  ) {
    return { ok: true };
  }

  const rollback = access.write(currentSnapshot);
  const rollbackRead = rollback.ok ? access.read() : null;
  if (
    !rollback.ok ||
    !rollbackRead?.ok ||
    !snapshotsMatch(currentSnapshot, rollbackRead.value)
  ) {
    return {
      ok: false,
      message: "インポートに失敗し、元のデータを完全に復元できませんでした。事前にダウンロードしたバックアップから復元してください。",
    };
  }
  return {
    ok: false,
    message: "インポートに失敗したため、変更前のデータへ戻しました。",
  };
}

export function replaceWithBackup(
  backup: CareerTrackBackupV1,
  currentSnapshot: CareerTrackDataSnapshot,
): BackupOperationResult {
  return replaceSnapshotTransaction(backup.data, currentSnapshot, {
    write: writeSnapshot,
    read: readCareerTrackSnapshot,
  });
}
