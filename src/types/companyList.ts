export type CompanyListSortKey =
  | "selection_priority"
  | "score_desc"
  | "score_asc"
  | "applied_desc"
  | "applied_asc"
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "company_name";

export interface CompanyListPreferences {
  sortKey: CompanyListSortKey;
}

export type ApplicationStatusGroup =
  | "in_progress"
  | "offer"
  | "on_hold"
  | "preparing"
  | "not_applied"
  | "withdrawn"
  | "closed"
  | "rejected";

export interface ApplicationSourceFilterOption {
  value: string;
  label: string;
}

export interface CompanyListFilters {
  sources: string[];
  statusGroups: ApplicationStatusGroup[];
}

export type CompanyListTab =
  | "all"
  | "in_progress"
  | "waiting_for_result"
  | "interview_scheduled"
  | "offer"
  | "withdrawn"
  | "rejected"
  | "archived";
