import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  ExternalLink,
  MessageSquareText,
  Pencil,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import {
  calculateTotalScore,
  resolveCompanyJudgment,
} from "../lib/evaluation";
import { companyStorage } from "../lib/storage";
import type { Company } from "../types/company";

const SOURCE_LABELS = Object.fromEntries(
  APPLICATION_SOURCE_OPTIONS.map(({ value, label }) => [value, label]),
) as Record<string, string>;

function displayValue(value?: string): string {
  return value?.trim() || "未設定";
}

function formatDate(value?: string): string {
  if (!value) {
    return "未設定";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function EvaluationSummary({ company }: { company: Company }) {
  const judgment = resolveCompanyJudgment(company);
  const isRated = company.decisionEvaluation.status === "rated";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={[
          "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
          judgment === null
            ? UNRATED_STYLE
            : JUDGMENT_STYLES[judgment],
        ].join(" ")}
      >
        {judgment === null ? UNRATED_LABEL : JUDGMENT_LABELS[judgment]}
      </span>
      <span className="text-sm font-semibold tabular-nums text-slate-900">
        {isRated
          ? `${calculateTotalScore(company.decisionEvaluation.scores)}点`
          : "総合点 —"}
      </span>
    </div>
  );
}

function ReferenceText({
  label,
  value,
  isUnconfirmed = false,
}: {
  label: string;
  value: string;
  isUnconfirmed?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        {isUnconfirmed && value.trim() && (
          <span className="rounded-sm border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800">
            未確認・自動減点なし
          </span>
        )}
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
        {value.trim() || "未入力"}
      </p>
    </div>
  );
}

export function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoadError("企業が指定されていません。");
      setIsLoading(false);
      return;
    }

    const result = companyStorage.read();
    if (!result.ok) {
      setLoadError(
        "企業データを読み込めませんでした。ブラウザの保存設定を確認してください。",
      );
      setIsLoading(false);
      return;
    }

    const target = result.value.find((item) => item.id === companyId);
    if (!target) {
      setLoadError("指定された企業が見つかりません。");
      setIsLoading(false);
      return;
    }

    setCompany(target);
    setIsLoading(false);
  }, [companyId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="企業詳細"
          description="企業情報を読み込んでいます。"
        />
        <div
          role="status"
          className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-600"
        >
          読み込み中...
        </div>
      </div>
    );
  }

  if (loadError || !company) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="企業詳細"
          description="企業情報を表示できませんでした。"
        />
        <div
          role="alert"
          className="border border-red-200 bg-red-50 p-5 text-red-800"
        >
          <div className="flex gap-3">
            <AlertCircle aria-hidden="true" size={20} />
            <p className="text-sm">{loadError}</p>
          </div>
          <Link
            to="/companies"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-red-300 bg-white px-4 text-sm font-semibold hover:bg-red-100"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            企業一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  const source = company.source.trim();

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title={company.name}
        description={displayValue(company.jobTitle)}
        action={
          <Link
            to="/companies"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft aria-hidden="true" size={17} />
            一覧へ戻る
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          to={`/companies/${company.id}/edit`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
        >
          <Pencil aria-hidden="true" size={17} />
          編集
        </Link>
        <Link
          to={`/companies/${company.id}/evaluate`}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-teal-300 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
        >
          <BarChart3 aria-hidden="true" size={17} />
          評価
        </Link>
        <Link
          to={`/companies/${company.id}/motivation`}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-sky-300 bg-white px-4 text-sm font-semibold text-sky-800 hover:bg-sky-50"
        >
          <MessageSquareText aria-hidden="true" size={17} />
          志望動機
        </Link>
      </div>

      <div className="space-y-6">
        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-950">
            概要
          </h2>
          <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">応募状況</dt>
              <dd className="mt-2">
                <span
                  className={[
                    "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                    APPLICATION_STATUS_STYLES[
                      company.applicationStatus
                    ],
                  ].join(" ")}
                >
                  {APPLICATION_STATUS_LABELS[company.applicationStatus]}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">評価</dt>
              <dd className="mt-2">
                <EvaluationSummary company={company} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">応募媒体</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {source ? (SOURCE_LABELS[source] ?? source) : "未設定"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">雇用形態</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {displayValue(company.employmentType)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">勤務地</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {displayValue(company.location)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">登録日</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {formatDate(company.createdAt)}
              </dd>
            </div>
          </dl>

          {company.jobUrl && (
            <a
              href={company.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline"
            >
              求人ページを開く
              <ExternalLink aria-hidden="true" size={15} />
            </a>
          )}
        </section>

        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-950">
            応募・予定
          </h2>
          <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">応募日</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {displayValue(company.appliedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">次の予定</dt>
              <dd className="mt-1 text-sm text-slate-800">
                {displayValue(company.nextAction)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-950">
            評価の参考情報
          </h2>
          <div className="mt-5 space-y-6">
            <ReferenceText label="良い点" value={company.strengths} />
            <ReferenceText label="気になる点" value={company.concerns} />
            <ReferenceText
              label="面接で確認したいこと"
              value={company.interviewConfirmationPoints}
              isUnconfirmed
            />
            <ReferenceText label="自由メモ" value={company.notes} />
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-950">
            総評
          </h2>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
            {company.decisionEvaluation.overallReview.trim() ||
              "総評はまだ登録されていません"}
          </p>
        </section>

      </div>
    </div>
  );
}
