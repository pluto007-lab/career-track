import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Copy,
  FileText,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import {
  createMotivationGenerationInput,
  getMotivationMissingInformation,
  MOTIVATION_MISSING_LABELS,
  updateCompanyMotivationFields,
  type CompanyMotivationFields,
} from "../lib/motivation";
import { buildMotivationPrompt } from "../lib/motivationPrompt";
import { companyStorage, profileStorage } from "../lib/storage";
import {
  APPLICANT_PROFILE_FIELDS,
  EMPTY_APPLICANT_PROFILE,
  type ApplicantProfile,
} from "../types/applicantProfile";
import type { Company } from "../types/company";
import type {
  MotivationLengthPreset,
  MotivationPurpose,
  MotivationTone,
} from "../types/motivation";

const LENGTH_PRESETS: ReadonlyArray<{
  value: MotivationLengthPreset;
  label: string;
}> = [
  { value: 150, label: "150字" },
  { value: 200, label: "200字" },
  { value: 300, label: "300字" },
  { value: 400, label: "400字" },
  { value: "custom", label: "自由入力" },
];

const TONE_OPTIONS: ReadonlyArray<{
  value: MotivationTone;
  label: string;
}> = [
  { value: "standard", label: "標準" },
  { value: "concise", label: "簡潔" },
  { value: "enthusiastic", label: "熱意を強める" },
  { value: "calm", label: "落ち着いた表現" },
];

const PURPOSE_OPTIONS: ReadonlyArray<{
  value: MotivationPurpose;
  label: string;
}> = [
  { value: "resume", label: "履歴書" },
  { value: "application_form", label: "応募フォーム" },
  { value: "interview_preparation", label: "面接準備" },
];

const EMPTY_MOTIVATION_FIELDS: CompanyMotivationFields = {
  motivationAppeal: "",
  motivationFocus: "",
  motivationAvoid: "",
  applicationNotes: "",
};

const MOTIVATION_FIELD_DEFINITIONS: ReadonlyArray<{
  key: keyof CompanyMotivationFields;
  label: string;
}> = [
  {
    key: "motivationAppeal",
    label: "この企業に魅力を感じた点",
  },
  {
    key: "motivationFocus",
    label: "志望動機で特に触れたい点",
  },
  {
    key: "motivationAvoid",
    label: "志望動機に入れたくない点",
  },
  {
    key: "applicationNotes",
    label: "企業への応募理由メモ",
  },
];

type MotivationSaveStatus = "idle" | "saving" | "success" | "error";

function contentStatus(value: string): string {
  return value.trim() ? "入力済み" : "未入力";
}

export function CompanyMotivationPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [profile, setProfile] = useState<ApplicantProfile>({
    ...EMPTY_APPLICANT_PROFILE,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lengthPreset, setLengthPreset] =
    useState<MotivationLengthPreset>(200);
  const [customLength, setCustomLength] = useState("200");
  const [tone, setTone] = useState<MotivationTone>("standard");
  const [purpose, setPurpose] =
    useState<MotivationPurpose>("resume");
  const [promptText, setPromptText] = useState("");
  const [promptError, setPromptError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [motivationFields, setMotivationFields] =
    useState<CompanyMotivationFields>(EMPTY_MOTIVATION_FIELDS);
  const [motivationSaveStatus, setMotivationSaveStatus] =
    useState<MotivationSaveStatus>("idle");
  const [motivationSaveError, setMotivationSaveError] =
    useState<string | null>(null);
  const [hasUnsavedMotivation, setHasUnsavedMotivation] =
    useState(false);

  useEffect(() => {
    if (!companyId) {
      setLoadError("志望動機を準備する企業が指定されていません。");
      setIsLoading(false);
      return;
    }

    const companyResult = companyStorage.read();
    if (!companyResult.ok) {
      setLoadError(
        "企業データを読み込めませんでした。ブラウザの保存設定を確認してください。",
      );
      setIsLoading(false);
      return;
    }

    const targetCompany = companyResult.value.find(
      (item) => item.id === companyId,
    );
    if (!targetCompany) {
      setLoadError("指定された企業が見つかりません。");
      setIsLoading(false);
      return;
    }

    const profileResult = profileStorage.read();
    if (!profileResult.ok) {
      setLoadError(
        "応募者プロフィールを読み込めませんでした。ブラウザの保存設定を確認してください。",
      );
      setIsLoading(false);
      return;
    }

    setCompany(targetCompany);
    setMotivationFields({
      motivationAppeal: targetCompany.motivationAppeal,
      motivationFocus: targetCompany.motivationFocus,
      motivationAvoid: targetCompany.motivationAvoid,
      applicationNotes: targetCompany.applicationNotes,
    });
    setProfile(profileResult.value);
    setIsLoading(false);
  }, [companyId]);

  const targetLength =
    lengthPreset === "custom" ? Number(customLength) : lengthPreset;

  const generationInput = useMemo(
    () =>
      company
        ? createMotivationGenerationInput({
            company,
            applicantProfile: profile,
            targetLength,
            tone,
            purpose,
          })
        : null,
    [company, profile, purpose, targetLength, tone],
  );

  const missingInformation = generationInput
    ? getMotivationMissingInformation(generationInput)
    : [];

  const updateMotivationField =
    (field: keyof CompanyMotivationFields) =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setMotivationFields((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      setHasUnsavedMotivation(true);
      setMotivationSaveStatus("idle");
      setMotivationSaveError(null);
    };

  const saveMotivationFields = async () => {
    if (
      !companyId ||
      !hasUnsavedMotivation ||
      motivationSaveStatus === "saving"
    ) {
      return;
    }

    setMotivationSaveStatus("saving");
    setMotivationSaveError(null);

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    const companyResult = companyStorage.read();
    if (!companyResult.ok) {
      setMotivationSaveError(
        "企業データを読み込めなかったため、保存できませんでした。もう一度お試しください。",
      );
      setMotivationSaveStatus("error");
      return;
    }

    const targetIndex = companyResult.value.findIndex(
      (item) => item.id === companyId,
    );
    if (targetIndex < 0) {
      setMotivationSaveError(
        "保存対象の企業が見つかりませんでした。企業一覧から開き直してください。",
      );
      setMotivationSaveStatus("error");
      return;
    }

    const updatedCompany = updateCompanyMotivationFields(
      companyResult.value[targetIndex],
      motivationFields,
    );
    const updatedCompanies = companyResult.value.map((item, index) =>
      index === targetIndex ? updatedCompany : item,
    );
    const writeResult = companyStorage.write(updatedCompanies);

    if (!writeResult.ok) {
      setMotivationSaveError(
        "志望理由の保存に失敗しました。もう一度お試しください。入力内容はこの画面に保持されています。",
      );
      setMotivationSaveStatus("error");
      return;
    }

    setCompany(updatedCompany);
    setMotivationFields({
      motivationAppeal: updatedCompany.motivationAppeal,
      motivationFocus: updatedCompany.motivationFocus,
      motivationAvoid: updatedCompany.motivationAvoid,
      applicationNotes: updatedCompany.applicationNotes,
    });
    setHasUnsavedMotivation(false);
    setMotivationSaveStatus("success");
  };

  const createPrompt = () => {
    if (
      !generationInput ||
      hasUnsavedMotivation ||
      motivationSaveStatus === "saving"
    ) {
      return;
    }

    if (!generationInput.jobPostingText.trim()) {
      setPromptError(
        "求人票が未入力のため、プロンプトを作成できません。企業編集画面で求人票・募集要項を入力してください。",
      );
      setCopyStatus(null);
      return;
    }

    setPromptText(buildMotivationPrompt(generationInput));
    setPromptError(null);
    setCopyStatus(null);
  };

  const copyPrompt = async () => {
    if (!promptText) {
      return;
    }

    if (!navigator.clipboard?.writeText) {
      setCopyStatus({
        type: "error",
        message:
          "このブラウザではコピー機能を利用できません。表示欄から手動でコピーしてください。",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(promptText);
      setCopyStatus({
        type: "success",
        message: "プロンプトをコピーしました。",
      });
    } catch {
      setCopyStatus({
        type: "error",
        message:
          "プロンプトをコピーできませんでした。表示欄から手動でコピーしてください。",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="志望動機の準備"
          description="企業情報と応募者情報を確認します。"
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

  if (loadError || !company || !generationInput) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="志望動機の準備"
          description="必要な情報を表示できませんでした。"
        />
        <div
          role="alert"
          className="border border-red-200 bg-red-50 p-5 text-red-800"
        >
          <div className="flex gap-3">
            <AlertCircle aria-hidden="true" className="shrink-0" size={20} />
            <div>
              <h2 className="font-semibold">情報を確認できません</h2>
              <p className="mt-1 text-sm leading-6">
                {loadError ?? "指定された情報が見つかりません。"}
              </p>
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

  const motivationNotes = generationInput.companyMotivationNotes;

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title="志望動機の準備"
        description={`${company.name}へ提出する志望動機の材料を確認します。`}
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

      {missingInformation.length > 0 && (
        <section
          aria-labelledby="missing-information-title"
          className="mb-6 border border-amber-200 bg-amber-50 p-4 text-amber-900"
        >
          <div className="flex gap-3">
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
            />
            <div>
              <h2
                id="missing-information-title"
                className="text-sm font-semibold"
              >
                生成前に確認したい情報
              </h2>
              <ul className="mt-2 space-y-1 text-sm leading-6">
                {missingInformation.map((item) => (
                  <li key={item}>{MOTIVATION_MISSING_LABELS[item]}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <section className="border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-50 text-teal-700">
                <Building2 aria-hidden="true" size={20} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">
                  {company.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {company.jobTitle || "求人職種は未入力です"}
                </p>
              </div>
            </div>
          </section>

          <details className="group border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
              <span className="flex items-center gap-3">
                <FileText
                  aria-hidden="true"
                  size={19}
                  className="text-teal-700"
                />
                <span className="font-semibold">求人票・募集要項</span>
              </span>
              <span className="text-xs text-slate-500">
                {contentStatus(company.jobPostingText)}
              </span>
            </summary>
            <div className="border-t border-slate-200 px-5 py-4">
              <p className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {company.jobPostingText || "求人票は入力されていません。"}
              </p>
            </div>
          </details>

          <details className="group border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
              <span className="flex items-center gap-3">
                <UserRound
                  aria-hidden="true"
                  size={19}
                  className="text-teal-700"
                />
                <span className="font-semibold">応募者プロフィール</span>
              </span>
              <span className="text-xs text-slate-500">
                {Object.values(profile).some((value) => value.trim())
                  ? "入力済み"
                  : "未入力"}
              </span>
            </summary>
            <div className="grid gap-4 border-t border-slate-200 px-5 py-4 sm:grid-cols-2">
              {APPLICANT_PROFILE_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <h3 className="text-xs font-semibold text-slate-500">
                    {label}
                  </h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {profile[key] || "未入力"}
                  </p>
                </div>
              ))}
            </div>
          </details>

          <details className="group border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
              <span className="flex items-center gap-3">
                <BriefcaseBusiness
                  aria-hidden="true"
                  size={19}
                  className="text-teal-700"
                />
                <span className="font-semibold">企業ごとの応募理由</span>
              </span>
              <span className="text-xs text-slate-500">
                {hasUnsavedMotivation
                  ? "未保存"
                  : contentStatus(
                      motivationNotes.appealPoints ||
                        motivationNotes.focusPoints ||
                        motivationNotes.applicationReason,
                    )}
              </span>
            </summary>
            <div className="space-y-5 border-t border-slate-200 px-5 py-5">
              <p className="text-sm leading-6 text-slate-600">
                この企業に合わせて、志望動機に使いたい内容を整理します。
              </p>

              {MOTIVATION_FIELD_DEFINITIONS.map(({ key, label }) => (
                <label key={key} className="block">
                  <span className="text-sm font-medium text-slate-800">
                    {label}
                  </span>
                  <textarea
                    wrap="soft"
                    value={motivationFields[key]}
                    disabled={motivationSaveStatus === "saving"}
                    onChange={updateMotivationField(key)}
                    className="mt-2 min-h-32 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:cursor-wait disabled:bg-slate-50"
                  />
                </label>
              ))}

              <div aria-live="polite">
                {motivationSaveStatus === "idle" &&
                  hasUnsavedMotivation && (
                    <div
                      role="status"
                      className="flex gap-2 border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"
                    >
                      <AlertCircle
                        aria-hidden="true"
                        className="mt-0.5 shrink-0"
                        size={17}
                      />
                      <span>未保存の変更があります。</span>
                    </div>
                  )}

                {motivationSaveStatus === "saving" && (
                  <div
                    role="status"
                    className="flex gap-2 border border-teal-200 bg-teal-50 p-3 text-sm leading-6 text-teal-800"
                  >
                    <Save
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      size={17}
                    />
                    <span>志望理由を保存しています。</span>
                  </div>
                )}

                {motivationSaveStatus === "success" && (
                  <div
                    role="status"
                    className="flex gap-2 border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                      size={17}
                    />
                    <span>
                      志望理由を保存しました。プロンプトを作成できるようになりました。
                    </span>
                  </div>
                )}

                {motivationSaveStatus === "error" &&
                  motivationSaveError && (
                    <div
                      role="alert"
                      className="flex gap-2 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"
                    >
                      <AlertCircle
                        aria-hidden="true"
                        className="mt-0.5 shrink-0"
                        size={17}
                      />
                      <span>{motivationSaveError}</span>
                    </div>
                  )}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to={`/companies/${company.id}/edit`}
                  className="inline-flex h-10 items-center justify-center text-sm font-semibold text-teal-800 hover:text-teal-950"
                >
                  企業情報をすべて編集
                </Link>
                <button
                  type="button"
                  disabled={
                    motivationSaveStatus === "saving" ||
                    !hasUnsavedMotivation
                  }
                  onClick={saveMotivationFields}
                  className="inline-flex h-11 w-full min-w-40 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <Save aria-hidden="true" size={18} />
                  {motivationSaveStatus === "saving"
                    ? "保存中…"
                    : motivationSaveStatus === "success"
                      ? "保存済み"
                      : motivationSaveStatus === "error"
                        ? "もう一度保存"
                        : "志望理由を保存"}
                </button>
              </div>
            </div>
          </details>
        </div>

        <section className="border border-slate-200 bg-white p-5 lg:sticky lg:top-22">
          <h2 className="text-base font-semibold text-slate-950">生成設定</h2>

          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-800">
                文字数の目安
              </span>
              <select
                value={lengthPreset}
                onChange={(event) => {
                  const value = event.target.value;
                  setLengthPreset(
                    value === "custom"
                      ? "custom"
                      : (Number(value) as MotivationLengthPreset),
                  );
                }}
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              >
                {LENGTH_PRESETS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {lengthPreset === "custom" && (
              <label className="block">
                <span className="text-sm font-medium text-slate-800">
                  文字数
                </span>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={customLength}
                  onChange={(event) => setCustomLength(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-slate-800">文体</span>
              <select
                value={tone}
                onChange={(event) =>
                  setTone(event.target.value as MotivationTone)
                }
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              >
                {TONE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-800">
                志望動機の用途
              </span>
              <select
                value={purpose}
                onChange={(event) =>
                  setPurpose(event.target.value as MotivationPurpose)
                }
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              >
                {PURPOSE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div className="border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={createPrompt}
                disabled={
                  hasUnsavedMotivation ||
                  motivationSaveStatus === "saving"
                }
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {promptText ? (
                  <RefreshCw aria-hidden="true" size={18} />
                ) : (
                  <FileText aria-hidden="true" size={18} />
                )}
                {promptText
                  ? "プロンプトを再作成"
                  : "プロンプトを作成"}
              </button>
              {hasUnsavedMotivation && (
                <p className="mt-2 text-xs leading-5 text-amber-800">
                  先に企業ごとの志望理由を保存してください。
                </p>
              )}
              {promptText && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  再作成すると、現在の編集内容は新しいプロンプトで置き換わります。
                </p>
              )}
            </div>

            {promptError && (
              <div
                role="alert"
                className="flex gap-2 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"
              >
                <AlertCircle
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={17}
                />
                <span>{promptError}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {promptText && (
        <section
          aria-labelledby="prompt-preview-title"
          className="mt-6 border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="prompt-preview-title"
                className="text-base font-semibold text-slate-950"
              >
                生成プロンプト
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                内容を確認し、必要に応じて編集してからコピーしてください。
              </p>
            </div>
            <button
              type="button"
              onClick={copyPrompt}
              className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-teal-300 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50 sm:w-auto"
            >
              <Copy aria-hidden="true" size={17} />
              コピー
            </button>
          </div>

          {copyStatus && (
            <div
              role={copyStatus.type === "error" ? "alert" : "status"}
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
            <span className="sr-only">生成プロンプトの内容</span>
            <textarea
              wrap="soft"
              value={promptText}
              onChange={(event) => {
                setPromptText(event.target.value);
                setCopyStatus(null);
              }}
              className="min-h-120 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 font-mono text-sm leading-6 text-slate-800 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </section>
      )}
    </div>
  );
}
