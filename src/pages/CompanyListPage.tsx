import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  BarChart3,
  Building2,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArchiveCompanyDialog } from "../components/ArchiveCompanyDialog";
import { EmptyState } from "../components/layout/EmptyState";
import { PageHeader } from "../components/layout/PageHeader";
import {
  APPLICATION_SOURCE_OPTIONS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  JUDGMENT_LABELS,
  JUDGMENT_STYLES,
  UNRATED_LABEL,
  UNRATED_STYLE,
} from "../constants/companyOptions";
import { resolveCompanyJudgment } from "../lib/evaluation";
import {
  APPLICATION_STATUS_GROUP_LABELS,
  APPLICATION_STATUS_GROUP_ORDER,
  COMPANY_LIST_TAB_LABELS,
  COMPANY_LIST_TAB_ORDER,
  createApplicationSourceFilterOptions,
  createCompanyListTabCounts,
  filterCompaniesBySelections,
  filterCompaniesByQuery,
  filterCompaniesByTab,
  getCurrentCompanyScore,
  sortCompanyList,
} from "../lib/companyList";
import {
  companyListPreferencesStorage,
  companyStorage,
} from "../lib/storage";
import type { Company } from "../types/company";
import type { CompanyListSortKey } from "../types/companyList";
import type {
  ApplicationStatusGroup,
  CompanyListFilters,
  CompanyListTab,
} from "../types/companyList";

const SORT_OPTIONS: ReadonlyArray<{
  value: CompanyListSortKey;
  label: string;
}> = [
  { value: "selection_priority", label: "選考状況順" },
  { value: "score_desc", label: "総合点が高い順" },
  { value: "score_asc", label: "総合点が低い順" },
  { value: "applied_desc", label: "応募日が新しい順" },
  { value: "applied_asc", label: "応募日が古い順" },
  { value: "created_desc", label: "登録日が新しい順" },
  { value: "created_asc", label: "登録日が古い順" },
  { value: "updated_desc", label: "最終更新日が新しい順" },
  { value: "company_name", label: "企業名順" },
];

const APPLICATION_SOURCE_LABELS = Object.fromEntries(
  APPLICATION_SOURCE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<string, string>;

function formatApplicationSource(value: string): string {
  const normalized = value.trim();
  return normalized
    ? (APPLICATION_SOURCE_LABELS[normalized] ?? normalized)
    : "未設定";
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "未設定";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function JudgmentBadge({ company }: { company: Company }) {
  const judgment = resolveCompanyJudgment(company);

  if (judgment === null) {
    return (
      <span
        className={[
          "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold",
          UNRATED_STYLE,
        ].join(" ")}
      >
        {UNRATED_LABEL}
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold",
        JUDGMENT_STYLES[judgment],
      ].join(" ")}
    >
      {JUDGMENT_LABELS[judgment]}
    </span>
  );
}

function ApplicationStatusBadge({ company }: { company: Company }) {
  return (
    <span
      className={[
        "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
        APPLICATION_STATUS_STYLES[company.applicationStatus],
      ].join(" ")}
    >
      {APPLICATION_STATUS_LABELS[company.applicationStatus]}
    </span>
  );
}

export function CompanyListPage() {
  const [initialPreferences] = useState(() => {
    const result = companyListPreferencesStorage.read();
    return {
      sortKey: result.value.sortKey,
      error: result.ok
        ? null
        : "並べ替え設定を読み込めませんでした。初期設定で表示しています。",
    };
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [preferencesError, setPreferencesError] = useState<string | null>(
    initialPreferences.error,
  );
  const [activeTab, setActiveTab] = useState<CompanyListTab>("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CompanyListFilters>({
    sources: [],
    statusGroups: [],
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState<CompanyListSortKey>(
    initialPreferences.sortKey,
  );
  const [archiveTarget, setArchiveTarget] = useState<Company | null>(
    null,
  );

  useEffect(() => {
    const result = companyStorage.read();

    if (!result.ok) {
      setStorageError(
        "企業データを読み込めませんでした。ブラウザの保存設定を確認してください。",
      );
      return;
    }

    setCompanies(result.value);
  }, []);

  const tabCounts = useMemo(
    () => createCompanyListTabCounts(companies),
    [companies],
  );
  const companiesInView = useMemo(
    () => filterCompaniesByTab(companies, activeTab),
    [activeTab, companies],
  );
  const sourceOptions = useMemo(
    () => createApplicationSourceFilterOptions(companiesInView),
    [companiesInView],
  );
  const filteredCompanies = useMemo(
    () => filterCompaniesBySelections(companiesInView, filters),
    [companiesInView, filters],
  );
  const visibleCompanies = useMemo(
    () =>
      sortCompanyList(
        filterCompaniesByQuery(filteredCompanies, query),
        sortKey,
      ),
    [filteredCompanies, query, sortKey],
  );
  const activeFilterCount =
    filters.sources.length + filters.statusGroups.length;

  const clearFilters = () => {
    setFilters({ sources: [], statusGroups: [] });
  };

  const changeTab = (nextTab: CompanyListTab) => {
    setActiveTab(nextTab);
    setQuery("");
    clearFilters();
    setIsFiltersOpen(false);
  };

  const toggleSourceFilter = (value: string) => {
    setFilters((current) => ({
      ...current,
      sources: current.sources.includes(value)
        ? current.sources.filter((source) => source !== value)
        : [...current.sources, value],
    }));
  };

  const toggleStatusGroupFilter = (value: ApplicationStatusGroup) => {
    setFilters((current) => ({
      ...current,
      statusGroups: current.statusGroups.includes(value)
        ? current.statusGroups.filter((group) => group !== value)
        : [...current.statusGroups, value],
    }));
  };

  const updateSort = (nextSortKey: CompanyListSortKey) => {
    setSortKey(nextSortKey);
    const result = companyListPreferencesStorage.write({
      sortKey: nextSortKey,
    });
    if (!result.ok) {
      setPreferencesError(
        "並べ替え設定を保存できませんでした。一覧の操作は続けられます。",
      );
    } else {
      setPreferencesError(null);
    }
  };

  const updateArchivedState = (
    companyId: string,
    archived: boolean,
  ) => {
    setStorageError(null);
    const readResult = companyStorage.read();

    if (!readResult.ok) {
      setStorageError(
        "企業データを読み込めなかったため、アーカイブ状態を変更できませんでした。",
      );
      return;
    }

    const targetExists = readResult.value.some(
      (company) => company.id === companyId,
    );
    if (!targetExists) {
      setArchiveTarget(null);
      return;
    }

    const updatedCompanies = readResult.value.map((company) =>
      company.id === companyId
        ? {
            ...company,
            archived,
            updatedAt: new Date().toISOString(),
          }
        : company,
    );
    const writeResult = companyStorage.write(updatedCompanies);

    if (!writeResult.ok) {
      setStorageError(
        "アーカイブ状態を保存できませんでした。もう一度お試しください。",
      );
      return;
    }

    setCompanies(updatedCompanies);
    setArchiveTarget(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title="企業一覧"
        description="応募候補を同じ基準で比較し、優先順位を整理します。"
      />

      {companies.length > 0 && (
        <div
          role="tablist"
          aria-label="企業一覧の表示切り替え"
          className="mb-5 grid grid-cols-2 gap-1 border-b border-slate-200 pb-1 sm:grid-cols-4 lg:flex lg:flex-wrap"
        >
          {COMPANY_LIST_TAB_ORDER.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => changeTab(tab)}
              className={[
                "min-w-0 border-b-2 px-3 py-3 text-sm font-semibold",
                activeTab === tab
                  ? "border-teal-700 bg-teal-50 text-teal-800"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")}
            >
              {COMPANY_LIST_TAB_LABELS[tab]}
              <span className="ml-1.5 tabular-nums text-xs">
                ({tabCounts[tab]})
              </span>
            </button>
          ))}
        </div>
      )}

      {preferencesError && (
        <div
          role="alert"
          className="mb-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {preferencesError}
        </div>
      )}

      {companies.length > 0 && (
        <section
          aria-label="企業一覧の検索と並べ替え"
          className="mb-5 flex flex-col gap-3 border border-slate-200 bg-white p-4 md:flex-row md:items-end"
        >
          <Link
            to="/companies/new"
            className="hidden h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 md:inline-flex"
          >
            <Plus aria-hidden="true" size={18} />
            企業を追加
          </Link>
          <label className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-600">
              企業を検索
            </span>
            <span className="relative mt-1 block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="会社名、職種、応募媒体、メモ、応募状況"
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </span>
          </label>
          <label className="md:w-56">
            <span className="text-xs font-medium text-slate-600">
              並べ替え
            </span>
            <select
              value={sortKey}
              onChange={(event) =>
                updateSort(event.target.value as CompanyListSortKey)
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
          <button
            type="button"
            aria-expanded={isFiltersOpen}
            aria-controls="company-list-filters"
            onClick={() => setIsFiltersOpen((current) => !current)}
            className={[
              "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold",
              activeFilterCount > 0
                ? "border-teal-300 bg-teal-50 text-teal-800"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            <SlidersHorizontal aria-hidden="true" size={17} />
            絞り込み
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-teal-700 px-2 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </section>
      )}

      {companies.length > 0 && isFiltersOpen && (
        <section
          id="company-list-filters"
          aria-label="企業一覧の絞り込み条件"
          className="mb-5 border border-slate-200 bg-white p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-950">
              絞り込み条件
            </h2>
            <button
              type="button"
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
              className="text-sm font-semibold text-teal-800 hover:text-teal-950 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              すべて解除
            </button>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">
                応募媒体
              </legend>
              {sourceOptions.length > 0 ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {sourceOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex min-w-0 cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={filters.sources.includes(option.value)}
                        onChange={() => toggleSourceFilter(option.value)}
                        className="mt-0.5 size-4 shrink-0 accent-teal-700"
                      />
                      <span className="min-w-0 break-words text-sm text-slate-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  この一覧には応募媒体が登録されていません。
                </p>
              )}
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">
                応募状況グループ
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {APPLICATION_STATUS_GROUP_ORDER.map((group) => (
                  <label
                    key={group}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={filters.statusGroups.includes(group)}
                      onChange={() => toggleStatusGroupFilter(group)}
                      className="mt-0.5 size-4 shrink-0 accent-teal-700"
                    />
                    <span className="text-sm text-slate-700">
                      {APPLICATION_STATUS_GROUP_LABELS[group]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </section>
      )}

      {storageError ? (
        <div
          role="alert"
          className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={18}
          />
          <span>{storageError}</span>
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="まだ企業が登録されていません"
          description="気になる企業を追加して、応募候補の管理を始めましょう。"
          action={
            <Link
              to="/companies/new"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus aria-hidden="true" size={17} />
              企業を追加
            </Link>
          }
        />
      ) : companiesInView.length === 0 ? (
        <EmptyState
          icon={activeTab === "archived" ? Archive : Building2}
          title={
            activeTab === "all"
              ? "企業一覧は空です"
              : `${COMPANY_LIST_TAB_LABELS[activeTab]}の企業はありません`
          }
          description={
            activeTab === "archived"
              ? "今後確認する必要がなくなった企業を、一覧からアーカイブできます。"
              : "企業の応募状況を更新すると、このタブへ表示されます。"
          }
        />
      ) : visibleCompanies.length === 0 ? (
        <EmptyState
          icon={Search}
          title="検索・絞り込み条件に一致する企業がありません"
          description="検索文字列または絞り込み条件を変更してください。"
          action={
            <button
              type="button"
              onClick={() => {
                setQuery("");
                clearFilters();
              }}
              className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              条件をすべて解除
            </button>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden border border-slate-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-240 border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      会社名
                    </th>
                    <th scope="col" className="px-4 py-3">
                      応募媒体
                    </th>
                    <th scope="col" className="px-4 py-3">
                      求人職種
                    </th>
                    <th scope="col" className="px-4 py-3">
                      応募状況
                    </th>
                    <th scope="col" className="px-4 py-3">
                      判定
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      総合点
                    </th>
                    <th scope="col" className="px-4 py-3">
                      登録日
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className={[
                        "hover:bg-slate-50",
                        company.applicationStatus === "rejected"
                          ? "border-l-4 border-l-red-400 bg-red-50/30"
                          : "",
                      ].join(" ")}
                    >
                      <th
                        scope="row"
                        className="max-w-56 px-4 py-4 font-semibold text-slate-950"
                      >
                        <span className="block truncate">{company.name}</span>
                      </th>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="inline-flex rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {formatApplicationSource(company.source)}
                        </span>
                      </td>
                      <td className="max-w-48 px-4 py-4 text-slate-600">
                        <span className="block truncate">
                          {company.jobTitle || "未設定"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                        <ApplicationStatusBadge company={company} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <JudgmentBadge company={company} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums">
                        {getCurrentCompanyScore(company) !== undefined
                          ? `${getCurrentCompanyScore(company)}点`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDate(company.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <Link
                            to={`/companies/${company.id}/motivation`}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-sky-300 bg-white px-3 text-sm font-semibold text-sky-800 hover:bg-sky-50"
                          >
                            <MessageSquareText
                              aria-hidden="true"
                              size={15}
                            />
                            志望動機
                          </Link>
                          <Link
                            to={`/companies/${company.id}/evaluate`}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-teal-300 bg-white px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                          >
                            <BarChart3 aria-hidden="true" size={15} />
                            評価
                          </Link>
                          <Link
                            to={`/companies/${company.id}/edit`}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <Pencil aria-hidden="true" size={15} />
                            編集
                          </Link>
                          {activeTab !== "archived" ? (
                            <button
                              type="button"
                              title="アーカイブ"
                              aria-label={`${company.name}をアーカイブ`}
                              onClick={() => setArchiveTarget(company)}
                              className="inline-grid size-9 place-items-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Archive aria-hidden="true" size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                updateArchivedState(company.id, false)
                              }
                              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              <ArchiveRestore
                                aria-hidden="true"
                                size={16}
                              />
                              一覧に戻す
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 md:hidden">
            {visibleCompanies.map((company) => (
              <article
                key={company.id}
                className={[
                  "border border-slate-200 bg-white p-4",
                  company.applicationStatus === "rejected"
                    ? "border-l-4 border-l-red-400 bg-red-50/30"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold text-slate-950">
                      {company.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {company.jobTitle || "職種未設定"}
                    </p>
                  </div>
                  <JudgmentBadge company={company} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200 pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">応募媒体</dt>
                    <dd className="mt-1">
                      <span className="inline-flex max-w-full whitespace-nowrap rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {formatApplicationSource(company.source)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">応募状況</dt>
                    <dd className="mt-1">
                      <ApplicationStatusBadge company={company} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">総合点</dt>
                    <dd className="mt-1 font-semibold tabular-nums">
                      {getCurrentCompanyScore(company) !== undefined
                        ? `${getCurrentCompanyScore(company)}点`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">登録日</dt>
                    <dd className="mt-1 text-slate-700">
                      {formatDate(company.createdAt)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
                  <Link
                    to={`/companies/${company.id}/motivation`}
                    className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-md border border-sky-300 bg-white px-2 text-xs font-semibold text-sky-800 hover:bg-sky-50"
                  >
                    <MessageSquareText aria-hidden="true" size={15} />
                    志望動機
                  </Link>
                  <Link
                    to={`/companies/${company.id}/evaluate`}
                    className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-md border border-teal-300 bg-white px-2 text-xs font-semibold text-teal-800 hover:bg-teal-50"
                  >
                    <BarChart3 aria-hidden="true" size={16} />
                    評価
                  </Link>
                  <Link
                    to={`/companies/${company.id}/edit`}
                    className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil aria-hidden="true" size={16} />
                    編集
                  </Link>
                </div>
                <div className="mt-2 flex justify-end">
                  {activeTab !== "archived" ? (
                    <button
                      type="button"
                      onClick={() => setArchiveTarget(company)}
                      className="inline-flex h-9 items-center gap-2 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <Archive aria-hidden="true" size={15} />
                      アーカイブ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        updateArchivedState(company.id, false)
                      }
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ArchiveRestore aria-hidden="true" size={15} />
                      一覧に戻す
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <ArchiveCompanyDialog
        companyName={archiveTarget?.name ?? null}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          if (archiveTarget) {
            updateArchivedState(archiveTarget.id, true);
          }
        }}
      />
      <Link
        to="/companies/new"
        aria-label="企業を追加"
        title="企業を追加"
        className="fixed bottom-22 right-4 z-10 grid size-14 place-items-center rounded-full bg-teal-700 text-white shadow-lg hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 md:hidden"
      >
        <Plus aria-hidden="true" size={24} />
      </Link>
    </div>
  );
}
