import {
  EMPTY_APPLICANT_PROFILE,
  type ApplicantProfile,
} from "../types/applicantProfile";
import type {
  ApplicationManagement,
  CareerTrackSettings,
  Company,
  DecisionEvaluation,
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

type PersistedCompany = Omit<
  Company,
  | "archived"
  | "evaluationStatus"
  | "jobPostingText"
  | "motivationAppeal"
  | "motivationFocus"
  | "motivationAvoid"
  | "motivationStatement"
  | "companySelfPromotion"
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
      | "applicationManagement"
    >
  > & {
    decisionEvaluation?: PersistedDecisionEvaluation;
  };

const EMPTY_DECISION_EVALUATION: DecisionEvaluation = {
  status: "unrated",
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

export const companyStorage = {
  read: (): StorageResult<Company[]> => {
    const result = readStorage<PersistedCompany[]>(
      STORAGE_KEYS.companies,
      [],
    );

    if (!result.ok) {
      return { ok: false, value: [], error: result.error };
    }

    return {
      ok: true,
      value: result.value.map((company) => {
        const legacyManagement = createLegacyApplicationManagement(
          company.nextActionDate,
          company.documentDeadline,
        );
        const persistedManagement = company.applicationManagement;
        const applicationManagement: ApplicationManagement =
          persistedManagement
            ? {
                nextEventAt: persistedManagement.nextEventAt,
                documentDeadline: persistedManagement.documentDeadline,
                responseDeadline: persistedManagement.responseDeadline,
                notes: persistedManagement.notes ?? "",
              }
            : legacyManagement;

        return {
          ...company,
          archived: company.archived ?? false,
          evaluationStatus: company.evaluationStatus ?? "unrated",
          jobPostingText: company.jobPostingText ?? "",
          motivationAppeal: company.motivationAppeal ?? "",
          motivationFocus: company.motivationFocus ?? "",
          motivationAvoid: company.motivationAvoid ?? "",
          motivationStatement: company.motivationStatement ?? "",
          companySelfPromotion: company.companySelfPromotion ?? "",
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
        };
      }),
    };
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

    return {
      ok: true,
      value: { ...EMPTY_APPLICANT_PROFILE, ...result.value },
    };
  },
  write: (profile: ApplicantProfile): StorageResult<undefined> =>
    writeStorage(STORAGE_KEYS.applicantProfile, profile),
};

const defaultSettings: CareerTrackSettings = {
  appName: "Career Track",
  sidebarCollapsed: false,
};

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

    return {
      ok: true,
      value: { ...defaultSettings, ...result.value },
    };
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

    return {
      ok: true,
      value: {
        sortKey:
          result.value.sortKey &&
          COMPANY_LIST_SORT_KEYS.has(result.value.sortKey)
            ? result.value.sortKey
            : defaultCompanyListPreferences.sortKey,
      },
    };
  },
  write: (
    preferences: CompanyListPreferences,
  ): StorageResult<undefined> =>
    writeStorage(STORAGE_KEYS.companyListPreferences, preferences),
};
