import {
  EMPTY_APPLICANT_PROFILE,
  type ApplicantProfile,
} from "../types/applicantProfile";
import {
  EMPTY_INTERVIEW_PREPARATION,
  type ApplicationManagement,
  type CareerTrackSettings,
  type Company,
  type DecisionEvaluation,
  type InterviewPreparation,
} from "../types/company";
import type {
  CompanyListPreferences,
  CompanyListSortKey,
} from "../types/companyList";
import { createLegacyApplicationManagement } from "./applicationManagement";

export const STORAGE_KEYS = {
  companies: "career-track-companies",
  settings: "career-track-settings",
  applicantProfile: "career-track-applicant-profile",
  companyListPreferences: "career-track-company-list-preferences",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type StorageOperation = "read" | "write" | "remove" | "parse";

export interface StorageError {
  operation: StorageOperation;
  key: StorageKey;
  cause: unknown;
}

export type StorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; value: T; error: StorageError };

function getStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function storageFailure<T>(
  operation: StorageOperation,
  key: StorageKey,
  cause: unknown,
  fallback: T,
): StorageResult<T> {
  return {
    ok: false,
    value: fallback,
    error: { operation, key, cause },
  };
}

export function readStorage<T>(
  key: StorageKey,
  fallback: T,
): StorageResult<T> {
  let value: string | null;

  try {
    value = getStorage()?.getItem(key) ?? null;
  } catch (cause: unknown) {
    return storageFailure("read", key, cause, fallback);
  }

  if (value === null) {
    return { ok: true, value: fallback };
  }

  try {
    return { ok: true, value: JSON.parse(value) as T };
  } catch (cause: unknown) {
    return storageFailure("parse", key, cause, fallback);
  }
}

export function writeStorage<T>(
  key: StorageKey,
  value: T,
): StorageResult<undefined> {
  try {
    getStorage()?.setItem(key, JSON.stringify(value));
    return { ok: true, value: undefined };
  } catch (cause: unknown) {
    return storageFailure("write", key, cause, undefined);
  }
}

export function removeStorage(key: StorageKey): StorageResult<undefined> {
  try {
    getStorage()?.removeItem(key);
    return { ok: true, value: undefined };
  } catch (cause: unknown) {
    return storageFailure("remove", key, cause, undefined);
  }
}

type PersistedDecisionEvaluation = Partial<
  Omit<DecisionEvaluation, "scores">
> & {
  scores?: Partial<DecisionEvaluation["scores"]>;
};

export type PersistedCompany = Omit<
  Company,
  | "archived"
  | "evaluationStatus"
  | "jobPostingText"
  | "motivationAppeal"
  | "motivationFocus"
  | "motivationAvoid"
  | "motivationStatement"
  | "companySelfPromotion"
  | "interviewConfirmationPoints"
  | "interviewPreparation"
  | "applicationManagement"
  | "decisionEvaluation"
> &
  Partial<
    Pick<
      Company,
      | "archived"
      | "evaluationStatus"
      | "jobPostingText"
      | "motivationAppeal"
      | "motivationFocus"
      | "motivationAvoid"
      | "motivationStatement"
      | "companySelfPromotion"
      | "interviewConfirmationPoints"
      | "interviewPreparation"
      | "applicationManagement"
    >
  > & {
    decisionEvaluation?: PersistedDecisionEvaluation;
  };

const EMPTY_DECISION_EVALUATION: DecisionEvaluation = {
  status: "unrated",
  overallReview: "",
  scores: {
    jobFit: 0,
    careerFit: 0,
    training: 0,
    growthEnvironment: 0,
    webDevelopment: 0,
    aiFit: 0,
    gitTeamDevelopment: 0,
    assignmentFlexibility: 0,
    workLifeBalance: 0,
    compensation: 0,
  },
  autoScore: 0,
  autoJudgment: "red",
  judgmentSelection: { mode: "auto" },
};

export type NormalizationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeInterviewPreparation(value: unknown): InterviewPreparation {
  if (!isRecord(value)) {
    return { ...EMPTY_INTERVIEW_PREPARATION };
  }

  const normalized = { ...EMPTY_INTERVIEW_PREPARATION };
  for (const key of Object.keys(normalized) as Array<keyof InterviewPreparation>) {
    normalized[key] = typeof value[key] === "string" ? value[key] : "";
  }
  return normalized;
}

export function normalizeCompanies(value: unknown): NormalizationResult<Company[]> {
  if (!Array.isArray(value)) {
    return { ok: false, message: "企業データが配列ではありません。" };
  }

  const companies: Company[] = [];
  for (const [index, item] of value.entries()) {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id.trim()) {
      return { ok: false, message: `企業データ${index + 1}件目のIDが不正です。` };
    }
    if (typeof item.name !== "string" || !item.name.trim()) {
      return { ok: false, message: `企業データ${index + 1}件目の会社名が不正です。` };
    }

    const company = item as PersistedCompany;
    const legacyManagement = createLegacyApplicationManagement(
      company.nextActionDate,
      company.documentDeadline,
    );
    const persistedManagement = company.applicationManagement;
    const applicationManagement: ApplicationManagement = persistedManagement
      ? {
          nextEventAt: persistedManagement.nextEventAt,
          documentDeadline: persistedManagement.documentDeadline,
          responseDeadline: persistedManagement.responseDeadline,
          notes: persistedManagement.notes ?? "",
        }
      : legacyManagement;

    companies.push({
      ...company,
      archived: company.archived ?? false,
      evaluationStatus: company.evaluationStatus ?? "unrated",
      jobPostingText: company.jobPostingText ?? "",
      motivationAppeal: company.motivationAppeal ?? "",
      motivationFocus: company.motivationFocus ?? "",
      motivationAvoid: company.motivationAvoid ?? "",
      motivationStatement: company.motivationStatement ?? "",
      companySelfPromotion: company.companySelfPromotion ?? "",
      interviewConfirmationPoints: company.interviewConfirmationPoints ?? "",
      interviewPreparation: normalizeInterviewPreparation(
        company.interviewPreparation,
      ),
      applicationManagement,
      decisionEvaluation: {
        ...EMPTY_DECISION_EVALUATION,
        ...company.decisionEvaluation,
        scores: {
          ...EMPTY_DECISION_EVALUATION.scores,
          ...company.decisionEvaluation?.scores,
        },
        judgmentSelection:
          company.decisionEvaluation?.judgmentSelection ??
          EMPTY_DECISION_EVALUATION.judgmentSelection,
      },
    });
  }

  return { ok: true, value: companies };
}

export function normalizeApplicantProfile(
  value: unknown,
): NormalizationResult<ApplicantProfile> {
  if (!isRecord(value)) {
    return { ok: false, message: "応募者プロフィールの形式が不正です。" };
  }
  return {
    ok: true,
    value: { ...EMPTY_APPLICANT_PROFILE, ...value } as ApplicantProfile,
  };
}

export const companyStorage = {
  read: (): StorageResult<Company[]> => {
    const result = readStorage<PersistedCompany[]>(
      STORAGE_KEYS.companies,
      [],
    );

    if (!result.ok) {
      return { ok: false, value: [], error: result.error };
    }

    const normalized = normalizeCompanies(result.value);
    if (!normalized.ok) {
      return storageFailure("parse", STORAGE_KEYS.companies, normalized.message, []);
    }
    return normalized;
  },
  write: (companies: Company[]): StorageResult<undefined> =>
    writeStorage(STORAGE_KEYS.companies, companies),
};

export const profileStorage = {
  read: (): StorageResult<ApplicantProfile> => {
    const result = readStorage<Partial<ApplicantProfile>>(
      STORAGE_KEYS.applicantProfile,
      {},
    );

    if (!result.ok) {
      return {
        ok: false,
        value: { ...EMPTY_APPLICANT_PROFILE },
        error: result.error,
      };
    }

    const normalized = normalizeApplicantProfile(result.value);
    if (!normalized.ok) {
      return storageFailure(
        "parse",
        STORAGE_KEYS.applicantProfile,
        normalized.message,
        { ...EMPTY_APPLICANT_PROFILE },
      );
    }
    return normalized;
  },
  write: (profile: ApplicantProfile): StorageResult<undefined> =>
    writeStorage(STORAGE_KEYS.applicantProfile, profile),
};

const defaultSettings: CareerTrackSettings = {
  appName: "Career Track",
  sidebarCollapsed: false,
};

export function normalizeSettings(
  value: unknown,
): NormalizationResult<CareerTrackSettings> {
  if (!isRecord(value)) {
    return { ok: false, message: "アプリ設定の形式が不正です。" };
  }
  if (value.appName !== undefined && typeof value.appName !== "string") {
    return { ok: false, message: "アプリ名の形式が不正です。" };
  }
  if (
    value.sidebarCollapsed !== undefined &&
    typeof value.sidebarCollapsed !== "boolean"
  ) {
    return { ok: false, message: "サイドバー設定の形式が不正です。" };
  }
  return { ok: true, value: { ...defaultSettings, ...value } };
}

export const settingsStorage = {
  read: (): StorageResult<CareerTrackSettings> => {
    const result = readStorage<Partial<CareerTrackSettings>>(
      STORAGE_KEYS.settings,
      {},
    );

    if (!result.ok) {
      return {
        ok: false,
        value: defaultSettings,
        error: result.error,
      };
    }

    const normalized = normalizeSettings(result.value);
    if (!normalized.ok) {
      return storageFailure(
        "parse",
        STORAGE_KEYS.settings,
        normalized.message,
        defaultSettings,
      );
    }
    return normalized;
  },
  write: (settings: CareerTrackSettings): StorageResult<undefined> =>
    writeStorage(STORAGE_KEYS.settings, settings),
};

const COMPANY_LIST_SORT_KEYS: ReadonlySet<CompanyListSortKey> =
  new Set([
    "selection_priority",
    "score_desc",
    "score_asc",
    "applied_desc",
    "applied_asc",
    "created_desc",
    "created_asc",
    "updated_desc",
    "company_name",
  ]);

const defaultCompanyListPreferences: CompanyListPreferences = {
  sortKey: "selection_priority",
};

export function normalizeCompanyListPreferences(
  value: unknown,
): NormalizationResult<CompanyListPreferences> {
  if (!isRecord(value)) {
    return { ok: false, message: "企業一覧設定の形式が不正です。" };
  }
  return {
    ok: true,
    value: {
      sortKey:
        typeof value.sortKey === "string" &&
        COMPANY_LIST_SORT_KEYS.has(value.sortKey as CompanyListSortKey)
          ? (value.sortKey as CompanyListSortKey)
          : defaultCompanyListPreferences.sortKey,
    },
  };
}

export const companyListPreferencesStorage = {
  read: (): StorageResult<CompanyListPreferences> => {
    const result = readStorage<Partial<CompanyListPreferences>>(
      STORAGE_KEYS.companyListPreferences,
      {},
    );
    if (!result.ok) {
      return {
        ok: false,
        value: defaultCompanyListPreferences,
        error: result.error,
      };
    }

    const normalized = normalizeCompanyListPreferences(result.value);
    if (!normalized.ok) {
      return storageFailure(
        "parse",
        STORAGE_KEYS.companyListPreferences,
        normalized.message,
        defaultCompanyListPreferences,
      );
    }
    return normalized;
  },
  write: (
    preferences: CompanyListPreferences,
  ): StorageResult<undefined> =>
    writeStorage(STORAGE_KEYS.companyListPreferences, preferences),
};
