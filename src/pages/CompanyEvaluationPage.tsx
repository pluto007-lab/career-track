import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileSearch,
  Save,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useParams,
} from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { EvaluationOverwriteDialog } from "../components/EvaluationOverwriteDialog";
import { UnsavedChangesDialog } from "../components/UnsavedChangesDialog";
import {
  JUDGMENT_LABELS,
  JUDGMENT_STYLES,
} from "../constants/companyOptions";
import {
  calculateAutoJudgment,
  calculateRawScore,
  calculateTotalScore,
  capJudgment,
  EVALUATION_ITEMS,
  MAX_RAW_EVALUATION_SCORE,
  sanitizeDecisionScores,
} from "../lib/evaluation";
import {
  buildEvaluationConsultationSummary,
  type JobPostingInclusion,
} from "../lib/evaluationConsultationSummary";
import {
  classifyPrimaryRole,
  createJobPostingEvaluationContext,
  detectScreeningWarnings,
  hasSufficientJobPostingText,
  ruleBasedJobPostingEvaluator,
  type EvaluationScoreDetails,
} from "../lib/jobPostingEvaluation";
import { companyStorage, profileStorage } from "../lib/storage";
import {
  EMPTY_APPLICANT_PROFILE,
  type ApplicantProfile,
} from "../types/applicantProfile";
import type {
  ApplicationStatus,
  DecisionCompanyScores,
  EvaluationStatus,
  Judgment,
  JudgmentSelection,
} from "../types/company";

const SCORE_OPTIONS = Array.from({ length: 11 }, (_, index) => index);
const JUDGMENTS: Judgment[] = ["green", "yellow", "orange", "red"];

export function CompanyEvaluationPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [applicationStatus, setApplicationStatus] =
    useState<ApplicationStatus>("not_applied");
  const [jobPostingText, setJobPostingText] = useState("");
  const [savedEvaluationStatus, setSavedEvaluationStatus] =
    useState<EvaluationStatus>("unrated");
  const [overallReview, setOverallReview] = useState("");
  const [strengths, setStrengths] = useState("");
  const [concerns, setConcerns] = useState("");
  const [
    interviewConfirmationPoints,
    setInterviewConfirmationPoints,
  ] = useState("");
  const [notes, setNotes] = useState("");
  const [scores, setScores] =
    useState<DecisionCompanyScores | null>(null);
  const [applicantProfile, setApplicantProfile] =
    useState<ApplicantProfile>({
      ...EMPTY_APPLICANT_PROFILE,
    });
  const [scoreDetails, setScoreDetails] =
    useState<Partial<EvaluationScoreDetails> | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [judgmentSelection, setJudgmentSelection] =
    useState<JudgmentSelection>({ mode: "auto" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [jobPostingInclusion, setJobPostingInclusion] =
    useState<JobPostingInclusion>("none");
  const [copyStatus, setCopyStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const summaryTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!companyId) {
      setLoadError("評価する企業が指定されていません。");
      return;
    }

    const result = companyStorage.read();
    if (!result.ok) {
      setLoadError(
        "企業データを読み込めませんでした。ブラウザの保存設定を確認してください。",
      );
      return;
    }

    const company = result.value.find((item) => item.id === companyId);
    if (!company) {
      setLoadError("指定された企業が見つかりません。");
      return;
    }

    const profileResult = profileStorage.read();
    if (!profileResult.ok) {
      setLoadError(
        "応募者プロフィールを読み込めませんでした。ブラウザの保存設定を確認してください。",
      );
      return;
    }

    const evaluation = company.decisionEvaluation;
    setCompanyName(company.name);
    setJobTitle(company.jobTitle);
    setApplicationStatus(company.applicationStatus);
    setJobPostingText(company.jobPostingText);
    setApplicantProfile(profileResult.value);
    setSavedEvaluationStatus(evaluation.status);
    setOverallReview(evaluation.overallReview);
    setStrengths(company.strengths);
    setConcerns(company.concerns);
    setInterviewConfirmationPoints(company.interviewConfirmationPoints);
    setNotes(company.notes);
    setScores(sanitizeDecisionScores(evaluation.scores));
    setScoreDetails(evaluation.scoreDetails ?? null);
    setJudgmentSelection(evaluation.judgmentSelection);
  }, [companyId]);

  const blocker = useBlocker(
    useCallback(() => isDirtyRef.current, []),
  );

  useBeforeUnload(
    useCallback((event) => {
      if (isDirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    }, []),
  );

  const markChanged = () => {
    isDirtyRef.current = true;
    setIsDirty(true);
    setStorageError(null);
    setCopyStatus(null);
  };

  const applyDraftEvaluation = () => {
    const draft = ruleBasedJobPostingEvaluator.evaluate(
      jobPostingText,
      createJobPostingEvaluationContext(applicantProfile, jobTitle),
    );
    setScores(draft.scores);
    setScoreDetails(draft.scoreDetails);
    setDraftError(null);
    setShowOverwriteDialog(false);
    markChanged();
  };

  const requestDraftEvaluation = () => {
    setDraftError(null);

    if (!hasSufficientJobPostingText(jobPostingText)) {
      setDraftError(
        "求人票の情報が不足しています。企業編集画面で募集要項を貼り付けてください",
      );
      return;
    }

    if (savedEvaluationStatus === "rated") {
      setShowOverwriteDialog(true);
      return;
    }

    applyDraftEvaluation();
  };

  const updateScore =
    (key: keyof DecisionCompanyScores) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = Number(event.target.value);
      setScores((current) =>
        current ? { ...current, [key]: value } : current,
      );
      setScoreDetails((current) => {
        if (!current?.[key]) {
          return current;
        }

        return {
          ...current,
          [key]: {
            ...current[key],
            score: value,
            manuallyAdjusted: value !== current[key].autoScore,
          },
        };
      });
      markChanged();
    };

  const selectAutomaticJudgment = () => {
    setJudgmentSelection({ mode: "auto" });
    markChanged();
  };

  const selectManualJudgment = () => {
    setJudgmentSelection((current) => ({
      mode: "manual",
      judgment:
        current.mode === "manual" ? current.judgment : "green",
    }));
    markChanged();
  };

  const updateManualJudgment = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    setJudgmentSelection({
      mode: "manual",
      judgment: event.target.value as Judgment,
    });
    markChanged();
  };

  const saveEvaluation = () => {
    if (!companyId || !scores) {
      return;
    }

    setIsSaving(true);
    setStorageError(null);

    const readResult = companyStorage.read();
    if (!readResult.ok) {
      setStorageError(
        "保存済みの企業データを読み込めませんでした。データ保護のため評価の保存を中止しました。",
      );
      setIsSaving(false);
      return;
    }

    const companyIndex = readResult.value.findIndex(
      (company) => company.id === companyId,
    );
    if (companyIndex < 0) {
      setStorageError(
        "評価対象の企業が見つからないため、保存できませんでした。",
      );
      setIsSaving(false);
      return;
    }

    const safeScores = sanitizeDecisionScores(scores);
    const totalScore = calculateTotalScore(safeScores);
    const normalJudgment = calculateAutoJudgment(totalScore);
    const screeningWarnings = detectScreeningWarnings(
      jobPostingText,
      createJobPostingEvaluationContext(applicantProfile, jobTitle),
    );
    const autoJudgment = capJudgment(
      normalJudgment,
      screeningWarnings.map((warning) => warning.judgmentCap),
    );
    const sanitizedScoreDetails = scoreDetails
      ? EVALUATION_ITEMS.reduce<Partial<EvaluationScoreDetails>>(
          (details, { key }) => {
            const detail = scoreDetails[key];
            if (detail) {
              details[key] = {
                ...detail,
                score: safeScores[key],
                manuallyAdjusted:
                  detail.autoScore !== undefined &&
                  detail.autoScore !== safeScores[key],
              };
            }
            return details;
          },
          {},
        )
      : undefined;
    const nextCompanies = readResult.value.map((company, index) =>
      index === companyIndex
        ? {
          ...company,
          strengths: strengths.trim(),
          concerns: concerns.trim(),
          interviewConfirmationPoints:
            interviewConfirmationPoints.trim(),
          notes: notes.trim(),
          decisionEvaluation: {
              status: "rated" as const,
              overallReview: overallReview.trim(),
              scores: safeScores,
              scoreDetails: sanitizedScoreDetails,
              autoScore: totalScore,
              autoJudgment,
              judgmentSelection,
            },
            updatedAt: new Date().toISOString(),
          }
        : company,
    );

    const writeResult = companyStorage.write(nextCompanies);
    if (!writeResult.ok) {
      setStorageError(
        "評価を保存できませんでした。ブラウザの保存容量や設定を確認して、もう一度お試しください。",
      );
      setIsSaving(false);
      return;
    }

    isDirtyRef.current = false;
    setIsDirty(false);
    navigate("/companies");
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="企業を評価"
          description="企業情報を表示できませんでした。"
        />
        <div
          role="alert"
          className="border border-red-200 bg-red-50 p-5 text-red-800"
        >
          <div className="flex gap-3">
            <AlertCircle aria-hidden="true" className="shrink-0" size={20} />
            <div>
              <h2 className="font-semibold">評価対象を確認できません</h2>
              <p className="mt-1 text-sm leading-6">{loadError}</p>
            </div>
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

  if (!scores) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="企業を評価"
          description="保存済みの企業情報を読み込んでいます。"
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

  const rawScore = calculateRawScore(scores);
  const totalScore = calculateTotalScore(scores);
  const normalJudgment = calculateAutoJudgment(totalScore);
  const screeningWarnings = detectScreeningWarnings(
    jobPostingText,
    createJobPostingEvaluationContext(applicantProfile, jobTitle),
  );
  const finalAutoJudgment = capJudgment(
    normalJudgment,
    screeningWarnings.map((warning) => warning.judgmentCap),
  );
  const displayedJudgment =
    judgmentSelection.mode === "manual"
      ? judgmentSelection.judgment
      : finalAutoJudgment;
  const primaryRoleClassification = classifyPrimaryRole(
    jobPostingText,
    jobTitle,
  );
  const consultationSummary = buildEvaluationConsultationSummary({
    companyName,
    jobTitle,
    applicationStatus,
    primaryRoleClassification,
    saveState: isDirty
      ? "unsaved"
      : savedEvaluationStatus === "rated"
        ? "saved"
        : "unrated",
    scores,
    scoreDetails: scoreDetails ?? undefined,
    rawScore,
    normalJudgment,
    finalAutoJudgment,
    manualJudgment:
      judgmentSelection.mode === "manual"
        ? judgmentSelection.judgment
        : undefined,
    displayedJudgment,
    screeningWarnings,
    strengths,
    concerns,
    interviewConfirmationPoints,
    notes,
    jobPostingText,
    jobPostingInclusion,
  });

  const copyConsultationSummary = async () => {
    if (!navigator.clipboard?.writeText) {
      setCopyStatus({
        type: "error",
        message:
          "このブラウザではコピー機能を利用できません。テキストを選択して手動でコピーしてください。",
      });
      window.requestAnimationFrame(() => {
        summaryTextAreaRef.current?.focus();
        summaryTextAreaRef.current?.select();
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(consultationSummary);
      setCopyStatus({
        type: "success",
        message: "コピーしました。",
      });
    } catch {
      setCopyStatus({
        type: "error",
        message:
          "コピーできませんでした。テキストを選択して手動でコピーしてください。",
      });
      window.requestAnimationFrame(() => {
        summaryTextAreaRef.current?.focus();
        summaryTextAreaRef.current?.select();
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title="企業を評価"
        description={`${companyName}の評価を入力します。`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/applications"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-100"
            >
              <ClipboardList aria-hidden="true" size={17} />
              応募管理
            </Link>
            <Link
              to="/companies"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft aria-hidden="true" size={17} />
              一覧へ戻る
            </Link>
          </div>
        }
      />

      {storageError && (
        <div
          role="alert"
          className="mb-5 flex gap-3 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={18}
          />
          <span>{storageError}</span>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                評価項目
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                各項目を0〜10点で評価してください。
              </p>
            </div>
            <button
              type="button"
              onClick={requestDraftEvaluation}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-teal-300 bg-white px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50"
            >
              <FileSearch aria-hidden="true" size={17} />
              求人票から仮評価
            </button>
          </div>

          {draftError && (
            <div
              role="alert"
              className="mb-5 flex gap-3 border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
            >
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={17}
              />
              <span>{draftError}</span>
            </div>
          )}

          {scoreDetails && (
            <p className="mb-5 text-xs leading-5 text-slate-500">
              以下は求人票の検出結果と応募者プロフィールとの比較です。根拠は参考情報として確認し、最終判断は現在の点数を優先してください。
            </p>
          )}

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {EVALUATION_ITEMS.map((item) => (
              <label key={item.key}>
                <span className="text-sm font-medium text-slate-800">
                  {item.label}
                </span>
                <select
                  value={scores[item.key]}
                  onChange={updateScore(item.key)}
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                >
                  {SCORE_OPTIONS.map((score) => (
                    <option key={score} value={score}>
                      {score}点
                    </option>
                  ))}
                </select>
                {scoreDetails?.[item.key] ? (
                  <div className="mt-2 border border-slate-200 bg-slate-50 p-3">
                    {scoreDetails[item.key]?.manuallyAdjusted && (
                      <p className="mb-2 text-xs font-medium text-amber-800">
                        仮評価
                        {scoreDetails[item.key]?.autoScore ?? "—"}点から
                        手動で調整されています。
                      </p>
                    )}
                    <ul className="space-y-2">
                      {scoreDetails[item.key]?.reasons
                        .slice(0, 3)
                        .map((reason, index) => (
                          <li
                            key={`${reason.type}-${reason.label}-${index}`}
                            className="text-xs leading-5 text-slate-700"
                          >
                            <span
                              className={[
                                "mr-1.5 inline-flex min-w-10 justify-center rounded-sm px-1.5 py-0.5 font-semibold",
                                reason.type === "positive"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : reason.type === "negative"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-slate-200 text-slate-700",
                              ].join(" ")}
                            >
                              {reason.type === "positive"
                                ? "加点"
                                : reason.type === "negative"
                                  ? "減点"
                                  : "比較"}
                            </span>
                            <span>{reason.label}</span>
                            {reason.delta !== 0 && (
                              <span className="ml-1 font-semibold tabular-nums">
                                {reason.delta > 0 ? "+" : ""}
                                {reason.delta}
                              </span>
                            )}
                            {reason.evidence && (
                              <span className="mt-1 block text-slate-500">
                                根拠：{reason.evidence}
                              </span>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : savedEvaluationStatus === "rated" ? (
                  <span className="mt-1.5 block text-xs leading-5 text-slate-500">
                    この保存済み評価には根拠データがありません。求人票から仮評価を再実行すると確認できます。
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </section>

        <div className="space-y-6 lg:sticky lg:top-22">
          <section
            aria-live="polite"
            className="border border-slate-200 bg-white p-5"
          >
            <div className="flex items-center gap-2">
              <Calculator
                aria-hidden="true"
                size={18}
                className="text-teal-700"
              />
              <h2 className="text-sm font-semibold text-slate-950">
                自動判定プレビュー
              </h2>
            </div>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-600">素点</dt>
                <dd className="font-semibold tabular-nums">
                  {rawScore} / {MAX_RAW_EVALUATION_SCORE}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-600">総合点</dt>
                <dd className="text-xl font-bold tabular-nums">
                  {totalScore}点
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-600">通常判定</dt>
                <dd>
                  <span
                    className={[
                      "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                      JUDGMENT_STYLES[normalJudgment],
                    ].join(" ")}
                  >
                    {JUDGMENT_LABELS[normalJudgment]}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-slate-600">
                  最終自動判定
                </dt>
                <dd>
                  <span
                    className={[
                      "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                      JUDGMENT_STYLES[finalAutoJudgment],
                    ].join(" ")}
                  >
                    {JUDGMENT_LABELS[finalAutoJudgment]}
                  </span>
                </dd>
              </div>
              {judgmentSelection.mode === "manual" && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <dt className="text-sm font-medium text-slate-700">
                    最終表示
                  </dt>
                  <dd>
                    <span
                      className={[
                        "inline-flex rounded-md border px-2 py-1 text-xs font-semibold",
                        JUDGMENT_STYLES[displayedJudgment],
                      ].join(" ")}
                    >
                      {JUDGMENT_LABELS[displayedJudgment]}（手動）
                    </span>
                  </dd>
                </div>
              )}
            </dl>

            {screeningWarnings.length > 0 && (
              <div
                role="alert"
                className="mt-5 border border-amber-300 bg-amber-50 p-3 text-amber-950"
              >
                <div className="flex gap-2">
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                    size={17}
                  />
                  <div>
                    <p className="text-sm font-semibold">
                      高得点でも応募を再検討してください
                    </p>
                    <ul className="mt-2 space-y-2 text-xs leading-5">
                      {screeningWarnings.map((warning) => (
                        <li key={warning.condition}>
                          <span className="font-semibold">
                            {warning.label}：
                          </span>
                          {warning.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {interviewConfirmationPoints.trim() && (
              <div className="mt-4 border border-sky-200 bg-sky-50 p-3 text-sky-900">
                <p className="text-sm font-semibold">確認待ち事項あり</p>
                <p className="mt-1 text-xs leading-5">
                  面接で確認したいことが登録されています。未確認情報のため、自動減点や判定上限には使用していません。
                </p>
              </div>
            )}
          </section>

          <section className="border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-950">
              表示する判定
            </h2>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="judgment-mode"
                  checked={judgmentSelection.mode === "auto"}
                  onChange={selectAutomaticJudgment}
                  className="size-4 accent-teal-700"
                />
                <span className="text-sm font-medium">
                  自動判定を使用
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="judgment-mode"
                  checked={judgmentSelection.mode === "manual"}
                  onChange={selectManualJudgment}
                  className="size-4 accent-teal-700"
                />
                <span className="text-sm font-medium">手動で判定</span>
              </label>
            </div>

            {judgmentSelection.mode === "manual" && (
              <label className="mt-4 block">
                <span className="text-xs font-medium text-slate-600">
                  手動判定
                </span>
                <select
                  value={judgmentSelection.judgment}
                  onChange={updateManualJudgment}
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                >
                  {JUDGMENTS.map((judgment) => (
                    <option key={judgment} value={judgment}>
                      {JUDGMENT_LABELS[judgment]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </section>
        </div>
      </div>

      <section className="mt-6 border border-slate-200 bg-white p-5 sm:p-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-base font-semibold text-slate-950">
            評価の参考情報
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            以下の記述内容も、総合判定や総評を考える際の参考情報として扱います。
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-800">
              良い点
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              評価を上げる判断の参考にします。
            </span>
            <textarea
              value={strengths}
              onChange={(event) => {
                setStrengths(event.target.value);
                markChanged();
              }}
              className="mt-2 min-h-36 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">
              気になる点
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              慎重な判定や減点判断の参考にします。
            </span>
            <textarea
              value={concerns}
              onChange={(event) => {
                setConcerns(event.target.value);
                markChanged();
              }}
              className="mt-2 min-h-36 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">
              面接で確認したいこと
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              未確認事項として扱い、入力されているだけでは減点しません。
            </span>
            <textarea
              value={interviewConfirmationPoints}
              onChange={(event) => {
                setInterviewConfirmationPoints(event.target.value);
                markChanged();
              }}
              className="mt-2 min-h-36 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-800">
              自由メモ
            </span>
            <span className="mt-1 block text-xs text-slate-500">
              評価に関係する補足情報を記録できます。
            </span>
            <textarea
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                markChanged();
              }}
              className="mt-2 min-h-36 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </div>
      </section>

      <section className="mt-6 border border-slate-200 bg-white p-5 sm:p-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-base font-semibold text-slate-950">
            総評
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            点数だけでは表せない印象や、応募判断の理由を記録できます。
          </p>
        </div>
        <label className="mt-5 block">
          <span className="sr-only">企業の総評</span>
          <textarea
            value={overallReview}
            onChange={(event) => {
              setOverallReview(event.target.value);
              markChanged();
            }}
            placeholder="仕事内容との相性、期待している点、懸念点などを自由に入力してください。"
            className="min-h-48 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
      </section>

      <details className="mt-6 border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:px-6">
          <span>
            <span className="block text-base font-semibold text-slate-950">
              AI相談用コピー
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              評価結果をMarkdown形式でコピーできます。
            </span>
          </span>
          <Copy
            aria-hidden="true"
            className="shrink-0 text-teal-700"
            size={20}
          />
        </summary>

        <div className="border-t border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <label className="block sm:max-w-xs sm:flex-1">
              <span className="text-sm font-medium text-slate-800">
                求人票原文
              </span>
              <select
                value={jobPostingInclusion}
                onChange={(event) => {
                  setJobPostingInclusion(
                    event.target.value as JobPostingInclusion,
                  );
                  setCopyStatus(null);
                }}
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              >
                <option value="none">求人票を含めない</option>
                <option value="excerpt">求人票を一部含める</option>
                <option value="full">求人票をすべて含める</option>
              </select>
            </label>

            <button
              type="button"
              onClick={copyConsultationSummary}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-teal-300 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50 sm:w-auto"
            >
              <Copy aria-hidden="true" size={18} />
              コピー
            </button>
          </div>

          {jobPostingInclusion === "excerpt" && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              求人票が2,000文字を超える場合は、先頭2,000文字だけを含めます。
            </p>
          )}

          {copyStatus && (
            <div
              role={copyStatus.type === "error" ? "alert" : "status"}
              aria-live="polite"
              className={[
                "mt-4 flex gap-2 border p-3 text-sm leading-6",
                copyStatus.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800",
              ].join(" ")}
            >
              {copyStatus.type === "success" ? (
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={17}
                />
              ) : (
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={17}
                />
              )}
              <span>{copyStatus.message}</span>
            </div>
          )}

          <label className="mt-4 block">
            <span className="sr-only">AI相談用の評価要約</span>
            <textarea
              ref={summaryTextAreaRef}
              readOnly
              wrap="soft"
              value={consultationSummary}
              className="min-h-96 max-h-[48rem] w-full resize-y overflow-y-auto rounded-md border border-slate-300 bg-slate-50 px-3 py-3 font-mono text-sm leading-6 text-slate-800 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </div>
      </details>

      <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
        <button
          type="button"
          disabled={isSaving}
          onClick={saveEvaluation}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Save aria-hidden="true" size={18} />
          {isSaving ? "保存中..." : "評価を保存"}
        </button>
      </div>

      <UnsavedChangesDialog
        open={blocker.state === "blocked"}
        onStay={() => {
          if (blocker.state === "blocked") {
            blocker.reset();
          }
        }}
        onLeave={() => {
          if (blocker.state === "blocked") {
            isDirtyRef.current = false;
            blocker.proceed();
          }
        }}
      />

      <EvaluationOverwriteDialog
        open={showOverwriteDialog}
        onCancel={() => setShowOverwriteDialog(false)}
        onConfirm={applyDraftEvaluation}
      />
    </div>
  );
}
