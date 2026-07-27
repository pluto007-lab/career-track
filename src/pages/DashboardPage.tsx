import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  FileCheck2,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/layout/EmptyState";
import { PageHeader } from "../components/layout/PageHeader";
import {
  createDashboardSummary,
  createDashboardTasks,
  formatDashboardDate,
  formatDashboardDueStatus,
  type DashboardSummary,
  type DashboardTask,
} from "../lib/dashboard";
import { companyStorage } from "../lib/storage";

const MAX_VISIBLE_TASKS = 5;

function getDueStatusClass(dayDifference: number): string {
  if (dayDifference < 0) {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (dayDifference === 0) {
    return "border-teal-200 bg-teal-50 text-teal-800";
  }
  if (dayDifference === 1) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const result = companyStorage.read();

    if (!result.ok) {
      setStorageError(
        "企業データを読み込めませんでした。ブラウザの保存設定を確認してください。",
      );
      return;
    }

    setSummary(createDashboardSummary(result.value));
    setTasks(createDashboardTasks(result.value));
  }, []);

  const summaryItems = [
    {
      label: "登録企業",
      value: summary?.totalCompanies,
      icon: Building2,
    },
    {
      label: "応募済み",
      value: summary?.appliedCompanies,
      icon: FileCheck2,
    },
    {
      label: "面接予定",
      value: summary?.interviewCompanies,
      icon: CalendarDays,
    },
    {
      label: "内定",
      value: summary?.offeredCompanies,
      icon: Trophy,
    },
  ];
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title="ダッシュボード"
        description="就職活動の進み具合と、次に取り組むことを確認します。"
      />

      <section
        aria-label="活動状況"
        className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {summaryItems.map(({ label, value, icon: Icon }) => (
          <article key={label} className="border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">{label}</span>
              <Icon aria-hidden="true" size={18} className="text-teal-700" />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">
              {value ?? "—"}
            </p>
          </article>
        ))}
      </section>

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
      ) : summary?.totalCompanies === 0 ? (
        <EmptyState
          icon={Building2}
          title="企業を登録すると、ここに活動状況が表示されます"
          description="まずは気になる企業を1社追加して、比較の準備を始めましょう。"
          action={
            <Link
              to="/companies/new"
              className="inline-flex h-10 items-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
            >
              企業を追加
            </Link>
          }
        />
      ) : summary ? (
        <section aria-labelledby="today-tasks-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2
                id="today-tasks-title"
                className="text-lg font-semibold text-slate-950"
              >
                今日やること
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                期限の近い予定を確認します。
              </p>
            </div>
            {tasks.length > MAX_VISIBLE_TASKS && (
              <Link
                to="/companies"
                className="hidden items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800 sm:inline-flex"
              >
                すべての企業を見る
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            )}
          </div>

          {visibleTasks.length === 0 ? (
            <div className="border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <CalendarDays
                aria-hidden="true"
                className="mx-auto text-slate-400"
                size={26}
              />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                現在、登録されている予定はありません
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                企業編集画面で「次の予定」と「次の予定日」を登録できます。
              </p>
              <Link
                to="/companies"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                企業一覧へ
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map((task) => {
                const relativeStatus = formatDashboardDueStatus(
                  task.dayDifference,
                );
                const displayedStatus =
                  relativeStatus ||
                  formatDashboardDate(task.dueDate);

                return (
                  <Link
                    key={task.companyId}
                    to={`/companies/${task.companyId}/edit`}
                    className="block border border-slate-200 bg-white p-4 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold text-slate-950">
                          {task.companyName}
                        </h3>
                        <p className="mt-1 break-words text-sm leading-6 text-slate-700">
                          {task.action}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                        <span className="text-xs text-slate-500">
                          {formatDashboardDate(task.dueDate)}
                        </span>
                        <span
                          className={[
                            "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                            getDueStatusClass(task.dayDifference),
                          ].join(" ")}
                        >
                          {displayedStatus}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {tasks.length > MAX_VISIBLE_TASKS && (
                <Link
                  to="/companies"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:hidden"
                >
                  すべての企業を見る
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              )}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
