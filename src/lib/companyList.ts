import {
  APPLICATION_SOURCE_OPTIONS,
  APPLICATION_STATUS_GROUP_LABELS as APPLICATION_STATUS_DISPLAY_GROUP_LABELS,
  APPLICATION_STATUS_LABELS,
} from "../constants/companyOptions";
import type { ApplicationStatus, Company } from "../types/company";
import type {
  ApplicationSourceFilterOption,
  ApplicationStatusGroup,
  CompanyListFilters,
  CompanyListSortKey,
  CompanyListTab,
} from "../types/companyList";
import { calculateTotalScore } from "./evaluation";

const SOURCE_LABELS = Object.fromEntries(
  APPLICATION_SOURCE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<string, string>;

export const UNSET_SOURCE_FILTER_VALUE = "__unset__";

export const APPLICATION_STATUS_GROUP_LABELS: Record<
  ApplicationStatusGroup,
  string
> = {
  in_progress: "選考中",
  offer: "内定",
  on_hold: "保留",
  preparing: "応募準備中",
  not_applied: "未応募",
  withdrawn: "辞退",
  closed: "求人終了",
  rejected: "不採用",
};

export const APPLICATION_STATUS_GROUP_ORDER: readonly ApplicationStatusGroup[] =
  [
    "in_progress",
    "offer",
    "on_hold",
    "preparing",
    "not_applied",
    "withdrawn",
    "closed",
    "rejected",
  ];

export const COMPANY_LIST_TAB_LABELS: Record<CompanyListTab, string> = {
  all: "すべて",
  in_progress: "選考中",
  waiting_for_result: "結果待ち",
  interview_scheduled: "面接予定",
  offer: "内定",
  withdrawn: "辞退",
  rejected: "不採用",
  archived: "アーカイブ",
};

export const COMPANY_LIST_TAB_ORDER: readonly CompanyListTab[] = [
  "all",
  "in_progress",
  "waiting_for_result",
  "interview_scheduled",
  "offer",
  "withdrawn",
  "rejected",
  "archived",
];

type StatusBasedCompanyListTab = Exclude<
  CompanyListTab,
  "all" | "archived"
>;

export const COMPANY_LIST_TAB_STATUSES: Record<
  StatusBasedCompanyListTab,
  readonly ApplicationStatus[]
> = {
  in_progress: [
    "applied",
    "waiting_for_reply",
    "scheduling",
    "document_screening",
    "document_passed",
    "casual_interview_scheduled",
    "first_interview_scheduled",
    "second_interview_scheduled",
    "final_interview_scheduled",
    "first_interview_completed",
    "second_interview_completed",
    "final_interview_completed",
    "waiting_for_result",
    "on_hold",
  ],
  waiting_for_result: [
    "first_interview_completed",
    "second_interview_completed",
    "final_interview_completed",
    "waiting_for_result",
  ],
  interview_scheduled: [
    "casual_interview_scheduled",
    "first_interview_scheduled",
    "second_interview_scheduled",
    "final_interview_scheduled",
  ],
  offer: ["offer"],
  withdrawn: ["withdrawn"],
  rejected: ["rejected"],
};

export function filterCompaniesByTab(
  companies: Company[],
  tab: CompanyListTab,
): Company[] {
  if (tab === "archived") {
    return companies.filter((company) => company.archived);
  }

  const activeCompanies = companies.filter(
    (company) => !company.archived,
  );
  if (tab === "all") {
    return activeCompanies;
  }

  const statuses: ReadonlySet<ApplicationStatus> = new Set(
    COMPANY_LIST_TAB_STATUSES[tab],
  );
  return activeCompanies.filter((company) =>
    statuses.has(company.applicationStatus),
  );
}

export function createCompanyListTabCounts(
  companies: Company[],
): Record<CompanyListTab, number> {
  return COMPANY_LIST_TAB_ORDER.reduce<Record<CompanyListTab, number>>(
    (counts, tab) => {
      counts[tab] = filterCompaniesByTab(companies, tab).length;
      return counts;
    },
    {
      all: 0,
      in_progress: 0,
      waiting_for_result: 0,
      interview_scheduled: 0,
      offer: 0,
      withdrawn: 0,
      rejected: 0,
      archived: 0,
    },
  );
}

const ACTUALLY_APPLIED_STATUSES: ReadonlySet<ApplicationStatus> =
  new Set([
    "applied",
    "waiting_for_reply",
    "scheduling",
    "document_screening",
    "document_passed",
    "casual_interview_scheduled",
    "first_interview_scheduled",
    "first_interview_completed",
    "second_interview_scheduled",
    "second_interview_completed",
    "final_interview_scheduled",
    "final_interview_completed",
    "waiting_for_result",
    "offer",
    "rejected",
    "withdrawn",
  ]);

export function countActuallyAppliedCompanies(
  companies: Company[],
): number {
  return companies.filter((company) =>
    ACTUALLY_APPLIED_STATUSES.has(company.applicationStatus),
  ).length;
}

const STATUS_GROUPS: Record<ApplicationStatus, ApplicationStatusGroup> = {
  applied: "in_progress",
  waiting_for_reply: "in_progress",
  scheduling: "in_progress",
  document_screening: "in_progress",
  document_passed: "in_progress",
  casual_interview_scheduled: "in_progress",
  first_interview_scheduled: "in_progress",
  second_interview_scheduled: "in_progress",
  final_interview_scheduled: "in_progress",
  first_interview_completed: "in_progress",
  second_interview_completed: "in_progress",
  final_interview_completed: "in_progress",
  waiting_for_result: "in_progress",
  offer: "offer",
  on_hold: "on_hold",
  preparing: "preparing",
  not_applied: "not_applied",
  withdrawn: "withdrawn",
  closed: "closed",
  rejected: "rejected",
};

const STATUS_GROUP_PRIORITY: Record<ApplicationStatus, number> = {
  not_applied: 1,
  preparing: 2,
  applied: 3,
  waiting_for_reply: 3,
  scheduling: 3,
  document_screening: 3,
  document_passed: 3,
  casual_interview_scheduled: 3,
  first_interview_scheduled: 3,
  second_interview_scheduled: 3,
  final_interview_scheduled: 3,
  first_interview_completed: 3,
  second_interview_completed: 3,
  final_interview_completed: 3,
  waiting_for_result: 3,
  offer: 4,
  on_hold: 5,
  withdrawn: 6,
  closed: 7,
  rejected: 8,
};

const SELECTION_DETAIL_PRIORITY: Record<ApplicationStatus, number> = {
  applied: 1,
  waiting_for_reply: 1,
  scheduling: 1,
  document_screening: 2,
  document_passed: 2,
  casual_interview_scheduled: 3,
  first_interview_scheduled: 3,
  second_interview_scheduled: 3,
  final_interview_scheduled: 3,
  first_interview_completed: 4,
  second_interview_completed: 4,
  final_interview_completed: 4,
  waiting_for_result: 4,
  offer: 5,
  on_hold: 6,
  preparing: 7,
  not_applied: 8,
  withdrawn: 9,
  closed: 10,
  rejected: 11,
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("ja-JP")
    .replace(/\s+/g, " ");
}

function normalizeSourceIdentity(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

const KNOWN_SOURCE_IDENTITIES = new Map<string, string>(
  APPLICATION_SOURCE_OPTIONS.flatMap(({ value, label }) => [
    [normalizeSourceIdentity(value), value] as const,
    [normalizeSourceIdentity(label), value] as const,
  ]),
);

export function getApplicationSourceFilterValue(source: string): string {
  const normalized = normalizeSourceIdentity(source);
  if (!normalized) {
    return UNSET_SOURCE_FILTER_VALUE;
  }
  return KNOWN_SOURCE_IDENTITIES.get(normalized) ?? normalized;
}

export function createApplicationSourceFilterOptions(
  companies: Company[],
): ApplicationSourceFilterOption[] {
  const options = new Map<string, ApplicationSourceFilterOption>();
  let hasUnsetSource = false;

  for (const company of companies) {
    const trimmedSource = company.source.trim();
    const value = getApplicationSourceFilterValue(trimmedSource);
    if (value === UNSET_SOURCE_FILTER_VALUE) {
      hasUnsetSource = true;
      continue;
    }

    const knownOption = APPLICATION_SOURCE_OPTIONS.find(
      (option) => option.value === value,
    );
    const label =
      knownOption?.label ?? SOURCE_LABELS[trimmedSource] ?? trimmedSource;
    if (!options.has(value)) {
      options.set(value, { value, label });
    }
  }

  const sortedOptions = [...options.values()].sort((left, right) =>
    left.label.localeCompare(right.label, "ja"),
  );
  return hasUnsetSource
    ? [
        ...sortedOptions,
        { value: UNSET_SOURCE_FILTER_VALUE, label: "未設定" },
      ]
    : sortedOptions;
}

export function getApplicationStatusGroup(
  status: ApplicationStatus,
): ApplicationStatusGroup {
  return STATUS_GROUPS[status];
}

export function filterCompaniesBySelections(
  companies: Company[],
  filters: CompanyListFilters,
): Company[] {
  const selectedSources = new Set(filters.sources);
  const selectedStatusGroups = new Set(filters.statusGroups);

  return companies.filter((company) => {
    const sourceMatches =
      selectedSources.size === 0 ||
      selectedSources.has(
        getApplicationSourceFilterValue(company.source),
      );
    const statusMatches =
      selectedStatusGroups.size === 0 ||
      selectedStatusGroups.has(
        getApplicationStatusGroup(company.applicationStatus),
      );
    return sourceMatches && statusMatches;
  });
}

function searchableText(company: Company): string {
  const statusLabel = APPLICATION_STATUS_LABELS[company.applicationStatus];
  const groupLabel =
    APPLICATION_STATUS_DISPLAY_GROUP_LABELS[
      company.applicationStatus
    ] ?? "";
  const source = company.source.trim();

  return normalizeSearchText(
    [
      company.name,
      company.jobTitle,
      source,
      SOURCE_LABELS[source] ?? "",
      company.notes,
      company.applicationNotes,
      company.applicationManagement.notes,
      statusLabel,
      groupLabel,
    ].join(" "),
  );
}

export function filterCompaniesByQuery(
  companies: Company[],
  query: string,
): Company[] {
  const terms = normalizeSearchText(query)
    .split(" ")
    .map((term) => term.replace(/\s+/g, ""))
    .filter(Boolean);
  if (terms.length === 0) {
    return companies;
  }

  return companies.filter((company) => {
    const target = searchableText(company).replace(/\s+/g, "");
    return terms.every((term) => target.includes(term));
  });
}

export function getCurrentCompanyScore(
  company: Company,
): number | undefined {
  return company.decisionEvaluation.status === "rated"
    ? calculateTotalScore(company.decisionEvaluation.scores)
    : undefined;
}

function compareOptionalNumber(
  left: number | undefined,
  right: number | undefined,
  direction: "asc" | "desc",
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }
  if (left === undefined) {
    return 1;
  }
  if (right === undefined) {
    return -1;
  }
  return direction === "asc" ? left - right : right - left;
}

function parseDate(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

export function sortCompanyList(
  companies: Company[],
  sortKey: CompanyListSortKey,
): Company[] {
  return [...companies].sort((left, right) => {
    const groupCompared =
      STATUS_GROUP_PRIORITY[left.applicationStatus] -
      STATUS_GROUP_PRIORITY[right.applicationStatus];
    if (groupCompared !== 0) {
      return groupCompared;
    }

    let compared = 0;
    switch (sortKey) {
      case "selection_priority":
        compared =
          SELECTION_DETAIL_PRIORITY[left.applicationStatus] -
          SELECTION_DETAIL_PRIORITY[right.applicationStatus];
        if (compared === 0) {
          compared =
            (parseDate(right.updatedAt) ?? 0) -
            (parseDate(left.updatedAt) ?? 0);
        }
        break;
      case "score_desc":
        compared = compareOptionalNumber(
          getCurrentCompanyScore(left),
          getCurrentCompanyScore(right),
          "desc",
        );
        break;
      case "score_asc":
        compared = compareOptionalNumber(
          getCurrentCompanyScore(left),
          getCurrentCompanyScore(right),
          "asc",
        );
        break;
      case "applied_desc":
        compared = compareOptionalNumber(
          parseDate(left.appliedAt),
          parseDate(right.appliedAt),
          "desc",
        );
        break;
      case "applied_asc":
        compared = compareOptionalNumber(
          parseDate(left.appliedAt),
          parseDate(right.appliedAt),
          "asc",
        );
        break;
      case "created_desc":
        compared = compareOptionalNumber(
          parseDate(left.createdAt),
          parseDate(right.createdAt),
          "desc",
        );
        break;
      case "created_asc":
        compared = compareOptionalNumber(
          parseDate(left.createdAt),
          parseDate(right.createdAt),
          "asc",
        );
        break;
      case "updated_desc":
        compared = compareOptionalNumber(
          parseDate(left.updatedAt),
          parseDate(right.updatedAt),
          "desc",
        );
        break;
      case "company_name":
        compared = left.name.localeCompare(right.name, "ja");
        break;
    }

    return compared || left.name.localeCompare(right.name, "ja");
  });
}
