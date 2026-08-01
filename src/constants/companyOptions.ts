import type {
  ApplicationStatus,
  Judgment,
  KnownApplicationSource,
} from "../types/company";

export const APPLICATION_STATUS_OPTIONS: ReadonlyArray<{
  value: ApplicationStatus;
  label: string;
}> = [
  { value: "not_applied", label: "未応募" },
  { value: "preparing", label: "応募準備中" },
  { value: "applied", label: "応募済み" },
  { value: "document_screening", label: "書類選考中" },
  { value: "document_passed", label: "書類通過" },
  { value: "first_interview_scheduled", label: "一次面接予定" },
  { value: "first_interview_completed", label: "一次面接済み" },
  { value: "second_interview_scheduled", label: "二次面接予定" },
  { value: "second_interview_completed", label: "二次面接済み" },
  { value: "final_interview_scheduled", label: "最終面接予定" },
  { value: "final_interview_completed", label: "最終面接済み" },
  { value: "casual_interview_scheduled", label: "カジュアル面談予定" },
  { value: "waiting_for_reply", label: "返信待ち" },
  { value: "scheduling", label: "日程調整中" },
  { value: "waiting_for_result", label: "結果待ち" },
  { value: "offer", label: "内定" },
  { value: "rejected", label: "不採用" },
  { value: "withdrawn", label: "辞退" },
  { value: "on_hold", label: "保留" },
  { value: "closed", label: "求人終了" },
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> =
  Object.fromEntries(
    APPLICATION_STATUS_OPTIONS.map(({ value, label }) => [value, label]),
  ) as Record<ApplicationStatus, string>;

export const APPLICATION_STATUS_GROUP_LABELS: Partial<
  Record<ApplicationStatus, string>
> = {
  first_interview_completed: "結果待ち",
  second_interview_completed: "結果待ち",
  final_interview_completed: "結果待ち",
  waiting_for_result: "結果待ち",
};

export const APPLICATION_STATUS_STYLES: Record<
  ApplicationStatus,
  string
> = {
  not_applied: "border-amber-200 bg-amber-50 text-amber-900",
  preparing: "border-amber-200 bg-amber-50 text-amber-900",
  applied: "border-sky-200 bg-sky-50 text-sky-900",
  waiting_for_reply: "border-sky-200 bg-sky-50 text-sky-900",
  scheduling: "border-sky-200 bg-sky-50 text-sky-900",
  document_screening: "border-sky-200 bg-sky-50 text-sky-900",
  document_passed: "border-sky-200 bg-sky-50 text-sky-900",
  casual_interview_scheduled:
    "border-sky-200 bg-sky-50 text-sky-900",
  first_interview_scheduled:
    "border-sky-200 bg-sky-50 text-sky-900",
  first_interview_completed:
    "border-sky-200 bg-sky-50 text-sky-900",
  second_interview_scheduled:
    "border-sky-200 bg-sky-50 text-sky-900",
  second_interview_completed:
    "border-sky-200 bg-sky-50 text-sky-900",
  final_interview_scheduled:
    "border-sky-200 bg-sky-50 text-sky-900",
  final_interview_completed:
    "border-sky-200 bg-sky-50 text-sky-900",
  waiting_for_result: "border-sky-200 bg-sky-50 text-sky-900",
  offer: "border-emerald-200 bg-emerald-50 text-emerald-900",
  rejected: "border-red-200 bg-red-50 text-red-900",
  withdrawn: "border-orange-300 bg-orange-50 text-orange-900",
  closed: "border-slate-300 bg-slate-100 text-slate-800",
  on_hold: "border-orange-200 bg-orange-50 text-orange-900",
};

export const JUDGMENT_LABELS: Record<Judgment, string> = {
  green: "応募推奨",
  yellow: "条件付き",
  orange: "保留",
  red: "見送り",
};

export const JUDGMENT_STYLES: Record<Judgment, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  yellow: "border-amber-200 bg-amber-50 text-amber-800",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

export const UNRATED_LABEL = "未評価";
export const UNRATED_STYLE =
  "border-slate-200 bg-slate-100 text-slate-700";

export const APPLICATION_SOURCE_OPTIONS: ReadonlyArray<{
  value: KnownApplicationSource;
  label: string;
}> = [
  { value: "company_website", label: "企業サイト" },
  { value: "indeed", label: "Indeed" },
  { value: "wantedly", label: "Wantedly" },
  { value: "green", label: "Green" },
  { value: "en_tenshoku", label: "エン転職" },
  { value: "mynavi", label: "マイナビ" },
  { value: "rikunabi", label: "リクナビ" },
  { value: "hellowork", label: "ハローワーク" },
  { value: "referral", label: "紹介" },
];

export const EMPLOYMENT_TYPE_OPTIONS = [
  "正社員",
  "契約社員",
  "派遣社員",
  "業務委託",
  "アルバイト・パート",
] as const;
