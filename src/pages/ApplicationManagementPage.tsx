import {
  AlertCircle,
  CalendarClock,
  ChevronRight,
  Clock3,
  Pencil,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import {
  APPLICATION_STATUS_GROUP_LABELS,
  APPLICATION_STATUS_LABELS,
} from "../constants/companyOptions";
import {
  deadlineToUtcMilliseconds,
  formatDeadline,
  formatJstDateTime,
  getCompanyScheduleStates,
  getScheduleState,
  sortApplicationCompanies,
  type ApplicationSort,
  type ScheduleState,
} from "../lib/applicationManagement";
import { companyStorage } from "../lib/storage";
import type { Company } from "../types/company";

const SORT_OPTIONS: ReadonlyArray<{
  value: ApplicationSort;
  label: string;
}> = [
  { value: "next_asc", label: "次回予定日時が近い順" },
  { value: "next_desc", label: "次回予定日時が遠い順" },
  { value: "applied_desc", label: "応募日が新しい順" },
  { value: "applied_asc", label: "応募日が古い順" },
];

const STATE_LABELS: Record<ScheduleState, string> = {
  overdue: "期限超過",
  today: "今日",
  within_seven_days: "7日以内",
  future: "今後",
};

const STATE_STYLES: Record<ScheduleState, string> = {
  overdue: "border-red-200 bg-red-50 text-red-800",
  today: "border-teal-200 bg-teal-50 text-teal-800",
  within_seven_days: "border-amber-200 bg-amber-50 text-amber-800",
  future: "border-slate-200 bg-slate-50 text-slate-700",
};

function ScheduleBadge({ timestamp }: { timestamp?: number }) {
  if (timestamp === undefined || Number.isNaN(timestamp)) {
    return null;
  }
  const state = getScheduleState(timestamp);
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-xs font-semibold ${STATE_STYLES[state]}`}
    >
      {STATE_LABELS[state]}
    </span>
  );
}

function statusLabel(company: Company): string {
  return (
    APPLICATION_STATUS_GROUP_LABELS[company.applicationStatus] ??
    APPLICATION_STATUS_LABELS[company.applicationStatus]
  );
}

function CompanyCard({ company }: { company: Company }) {
  const nextTimestamp = company.applicationManagement.nextEventAt
    ? Date.parse(company.applicationManagement.nextEventAt)
    : undefined;
  const documentTimestamp = deadlineToUtcMilliseconds(
    company.applicationManagement.documentDeadline,
  );
  const responseTimestamp = deadlineToUtcMilliseconds(
    company.applicationManagement.responseDeadline,
  );

  return (
    <article className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-950">{company.name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {company.jobTitle || "求人職種未設定"}
          </p>
        </div>
        <span className="shrink-0 rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
          {statusLabel(company)}
        </span>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">応募日</dt>
          <dd className="mt-1">{company.appliedAt || "未設定"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">次回予定</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            <span>{company.nextAction || "内容未設定"}</span>
            <span>{formatJstDateTime(company.applicationManagement.nextEventAt)}</span>
            <ScheduleBadge timestamp={nextTimestamp} />
          </dd>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">書類提出期限</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              {formatDeadline(company.applicationManagement.documentDeadline)}
              <ScheduleBadge timestamp={documentTimestamp} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">返信期限</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              {formatDeadline(company.applicationManagement.responseDeadline)}
              <ScheduleBadge timestamp={responseTimestamp} />
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-xs text-slate-500">メモ</dt>
          <dd className="mt-1 whitespace-pre-wrap text-slate-700">
            {company.applicationManagement.notes || "未入力"}
          </dd>
        </div>
      </dl>

      <Link
        to={`/companies/${company.id}/edit`}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <Pencil aria-hidden="true" size={16} />
        編集
      </Link>
    </article>
  );
}

export function ApplicationManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sort, setSort] = useState<ApplicationSort>("next_asc");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const result = companyStorage.read();
    if (!result.ok) {
      setLoadError(
        "企業データを読み込めませんでした。ブラウザの保存設定を確認してください。",
      );
      return;
    }
    setCompanies(result.value.filter((company) => !company.archived));
  }, []);

  const sortedCompanies = useMemo(
    () => sortApplicationCompanies(companies, sort),
    [companies, sort],
  );

  const summary = useMemo(() => {
    const states = companies.flatMap((company) =>
      getCompanyScheduleStates(company),
    );
    return {
      today: states.filter((state) => state === "today").length,
      withinSevenDays: states.filter(
        (state) => state === "within_seven_days",
      ).length,
      overdue: states.filter((state) => state === "overdue").length,
    };
  }, [companies]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title="応募管理"
        description="次回予定や提出期限を日付順に確認できます。"
      />

      {loadError && (
        <div
          role="alert"
          className="mb-5 flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle aria-hidden="true" className="shrink-0" size={18} />
          <span>{loadError}</span>
        </div>
      )}

      {!loadError && (
        <>
          <section
            aria-label="直近予定"
            className="mb-6 grid gap-3 sm:grid-cols-3"
          >
            {[
              {
                label: "今日",
                value: summary.today,
                icon: CalendarClock,
                style: "text-teal-700",
              },
              {
                label: "7日以内",
                value: summary.withinSevenDays,
                icon: Clock3,
                style: "text-amber-700",
              },
              {
                label: "期限超過",
                value: summary.overdue,
                icon: AlertCircle,
                style: "text-red-700",
              },
            ].map(({ label, value, icon: Icon, style }) => (
              <div
                key={label}
                className="flex items-center justify-between border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="text-sm text-slate-600">{label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {value}
                    <span className="ml-1 text-sm font-medium">件</span>
                  </p>
                </div>
                <Icon aria-hidden="true" className={style} size={22} />
              </div>
            ))}
          </section>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <p className="text-sm text-slate-600">
              {companies.length}社を表示
            </p>
            <label className="block sm:w-64">
              <span className="text-xs font-medium text-slate-600">
                並べ替え
              </span>
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as ApplicationSort)
                }
                className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {companies.length === 0 ? (
            <section className="border border-slate-200 bg-white p-8 text-center">
              <CalendarClock
                aria-hidden="true"
                className="mx-auto text-slate-400"
                size={30}
              />
              <h2 className="mt-3 font-semibold text-slate-950">
                応募管理する企業がありません
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                企業を登録すると、ここで予定と期限を確認できます。
              </p>
              <Link
                to="/companies/new"
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
              >
                企業を追加
                <ChevronRight aria-hidden="true" size={16} />
              </Link>
            </section>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {sortedCompanies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>

              <div className="hidden overflow-x-auto border border-slate-200 bg-white lg:block">
                <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">企業・職種</th>
                      <th className="px-4 py-3">選考ステータス</th>
                      <th className="px-4 py-3">応募日</th>
                      <th className="px-4 py-3">次回予定日時</th>
                      <th className="px-4 py-3">書類提出期限</th>
                      <th className="px-4 py-3">返信期限</th>
                      <th className="px-4 py-3">メモ</th>
                      <th className="px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sortedCompanies.map((company) => {
                      const nextTimestamp =
                        company.applicationManagement.nextEventAt
                          ? Date.parse(
                              company.applicationManagement.nextEventAt,
                            )
                          : undefined;
                      const documentTimestamp =
                        deadlineToUtcMilliseconds(
                          company.applicationManagement.documentDeadline,
                        );
                      const responseTimestamp =
                        deadlineToUtcMilliseconds(
                          company.applicationManagement.responseDeadline,
                        );

                      return (
                        <tr key={company.id} className="align-top">
                          <td className="px-4 py-4">
                            <span className="font-semibold text-slate-950">
                              {company.name}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">
                              {company.jobTitle || "求人職種未設定"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              {statusLabel(company)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {company.appliedAt || "未設定"}
                          </td>
                          <td className="px-4 py-4">
                            <span className="block font-medium">
                              {company.nextAction || "内容未設定"}
                            </span>
                            <span className="mt-1 block whitespace-nowrap text-xs text-slate-600">
                              {formatJstDateTime(
                                company.applicationManagement.nextEventAt,
                              )}
                            </span>
                            <span className="mt-2 block">
                              <ScheduleBadge timestamp={nextTimestamp} />
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="block whitespace-nowrap">
                              {formatDeadline(
                                company.applicationManagement
                                  .documentDeadline,
                              )}
                            </span>
                            <span className="mt-2 block">
                              <ScheduleBadge
                                timestamp={documentTimestamp}
                              />
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="block whitespace-nowrap">
                              {formatDeadline(
                                company.applicationManagement
                                  .responseDeadline,
                              )}
                            </span>
                            <span className="mt-2 block">
                              <ScheduleBadge
                                timestamp={responseTimestamp}
                              />
                            </span>
                          </td>
                          <td className="max-w-52 px-4 py-4">
                            <span className="line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                              {company.applicationManagement.notes ||
                                "未入力"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link
                              to={`/companies/${company.id}/edit`}
                              aria-label={`${company.name}を編集`}
                              className="inline-flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                            >
                              <Pencil aria-hidden="true" size={17} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
