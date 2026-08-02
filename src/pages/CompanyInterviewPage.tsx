import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
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
  useParams,
} from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { UnsavedChangesDialog } from "../components/UnsavedChangesDialog";
import { companyStorage } from "../lib/storage";
import {
  EMPTY_INTERVIEW_PREPARATION,
  type Company,
  type InterviewPreparation,
} from "../types/company";

interface InterviewPreparationDraft extends InterviewPreparation {
  interviewConfirmationPoints: string;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

const EMPTY_DRAFT: InterviewPreparationDraft = {
  interviewConfirmationPoints: "",
  ...EMPTY_INTERVIEW_PREPARATION,
};

const BEFORE_INTERVIEW_FIELDS: ReadonlyArray<{
  key: keyof InterviewPreparationDraft;
  label: string;
  description?: string;
}> = [
  {
    key: "interviewConfirmationPoints",
    label: "面接で質問したいこと",
    description: "評価・メモ画面の「面接で確認したいこと」と同じ内容です。",
  },
  { key: "expectedQuestions", label: "想定質問・回答メモ" },
  { key: "talkingPoints", label: "当日話したいこと" },
  { key: "preparationNotes", label: "面接前の準備メモ" },
];

const AFTER_INTERVIEW_FIELDS: ReadonlyArray<{
  key: keyof InterviewPreparationDraft;
  label: string;
}> = [
  { key: "askedQuestions", label: "聞かれた質問" },
  { key: "interviewerImpression", label: "面接官・会社の印象" },
  { key: "positiveReflection", label: "良かった点" },
  { key: "concernsAfterInterview", label: "気になった点" },
  { key: "nextImprovements", label: "次回に改善すること" },
];

function createDraft(company: Company): InterviewPreparationDraft {
  return {
    interviewConfirmationPoints: company.interviewConfirmationPoints,
    ...company.interviewPreparation,
  };
}

function trimPreparation(
  draft: InterviewPreparationDraft,
): InterviewPreparation {
  return {
    expectedQuestions: draft.expectedQuestions.trim(),
    talkingPoints: draft.talkingPoints.trim(),
    preparationNotes: draft.preparationNotes.trim(),
    askedQuestions: draft.askedQuestions.trim(),
    interviewerImpression: draft.interviewerImpression.trim(),
    positiveReflection: draft.positiveReflection.trim(),
    concernsAfterInterview: draft.concernsAfterInterview.trim(),
    nextImprovements: draft.nextImprovements.trim(),
  };
}

export function CompanyInterviewPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [draft, setDraft] = useState<InterviewPreparationDraft>(EMPTY_DRAFT);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!companyId) {
      setLoadError("面接対策を行う企業が指定されていません。");
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
    setDraft(createDraft(target));
    setIsLoading(false);
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

  const updateField =
    (key: keyof InterviewPreparationDraft) =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setDraft((current) => ({ ...current, [key]: event.target.value }));
      isDirtyRef.current = true;
      setIsDirty(true);
      setSaveStatus("idle");
      setSaveError(null);
    };

  const save = async () => {
    if (!companyId || !isDirty || saveStatus === "saving") {
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);
    await new Promise<void>((resolve) =>
      window.requestAnimationFrame(() => resolve()),
    );

    const result = companyStorage.read();
    if (!result.ok) {
      setSaveError(
        "企業データを読み込めなかったため、保存を中止しました。入力内容はこの画面に保持されています。",
      );
      setSaveStatus("error");
      return;
    }

    const targetIndex = result.value.findIndex((item) => item.id === companyId);
    if (targetIndex < 0) {
      setSaveError("保存対象の企業が見つかりませんでした。");
      setSaveStatus("error");
      return;
    }

    const updatedCompany: Company = {
      ...result.value[targetIndex],
      interviewConfirmationPoints: draft.interviewConfirmationPoints.trim(),
      interviewPreparation: trimPreparation(draft),
      updatedAt: new Date().toISOString(),
    };
    const updatedCompanies = result.value.map((item, index) =>
      index === targetIndex ? updatedCompany : item,
    );
    const writeResult = companyStorage.write(updatedCompanies);

    if (!writeResult.ok) {
      setSaveError(
        "面接対策の保存に失敗しました。もう一度お試しください。入力内容はこの画面に保持されています。",
      );
      setSaveStatus("error");
      return;
    }

    setCompany(updatedCompany);
    setDraft(createDraft(updatedCompany));
    isDirtyRef.current = false;
    setIsDirty(false);
    setSaveStatus("success");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader title="面接対策" description="企業情報を読み込んでいます。" />
        <div role="status" className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          読み込み中...
        </div>
      </div>
    );
  }

  if (loadError || !company) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader title="面接対策" description="企業情報を表示できませんでした。" />
        <div role="alert" className="border border-red-200 bg-red-50 p-5 text-red-800">
          <div className="flex gap-3">
            <AlertCircle aria-hidden="true" size={20} />
            <p className="text-sm">{loadError}</p>
          </div>
          <Link to="/companies" className="mt-5 inline-flex h-10 items-center gap-2 rounded-md border border-red-300 bg-white px-4 text-sm font-semibold hover:bg-red-100">
            <ArrowLeft aria-hidden="true" size={17} />
            企業一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  const renderFields = (
    fields: ReadonlyArray<{
      key: keyof InterviewPreparationDraft;
      label: string;
      description?: string;
    }>,
  ) => (
    <div className="mt-5 grid gap-5 sm:grid-cols-2">
      {fields.map(({ key, label, description }) => (
        <label key={key} className="block">
          <span className="text-sm font-medium text-slate-800">{label}</span>
          {description && (
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              {description}
            </span>
          )}
          <textarea
            value={draft[key]}
            onChange={updateField(key)}
            className="mt-2 min-h-40 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title="面接対策"
        description={`${company.name}・${company.jobTitle.trim() || "求人職種未設定"}`}
        action={
          <Link to={`/companies/${company.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <ArrowLeft aria-hidden="true" size={17} />
            企業詳細へ戻る
          </Link>
        }
      />

      <div className="space-y-6">
        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-950">面接前の準備</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">質問や回答、当日伝えたい内容をまとめます。</p>
          </div>
          {renderFields(BEFORE_INTERVIEW_FIELDS)}
        </section>

        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-950">面接後の振り返り</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">面接で得た情報と次回へ活かす内容を記録します。</p>
          </div>
          {renderFields(AFTER_INTERVIEW_FIELDS)}
        </section>
      </div>

      <div aria-live="polite" className="mt-5">
        {isDirty && saveStatus === "idle" && (
          <p role="status" className="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">未保存の変更があります。</p>
        )}
        {saveStatus === "success" && (
          <p role="status" className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 aria-hidden="true" size={18} />面接対策を保存しました。
          </p>
        )}
        {saveStatus === "error" && saveError && (
          <p role="alert" className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
            <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />{saveError}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end border-t border-slate-200 pt-5">
        <button
          type="button"
          disabled={!isDirty || saveStatus === "saving"}
          onClick={save}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Save aria-hidden="true" size={18} />
          {saveStatus === "saving" ? "保存中…" : saveStatus === "error" ? "もう一度保存" : saveStatus === "success" ? "保存済み" : "面接対策を保存"}
        </button>
      </div>

      <UnsavedChangesDialog
        open={blocker.state === "blocked"}
        onStay={() => {
          if (blocker.state === "blocked") blocker.reset();
        }}
        onLeave={() => {
          if (blocker.state === "blocked") {
            isDirtyRef.current = false;
            blocker.proceed();
          }
        }}
      />
    </div>
  );
}
