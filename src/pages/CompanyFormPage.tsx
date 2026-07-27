import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useNavigate,
  useParams,
} from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { UnsavedChangesDialog } from "../components/UnsavedChangesDialog";
import { DuplicateCompanyDialog } from "../components/DuplicateCompanyDialog";
import {
  APPLICATION_SOURCE_OPTIONS,
  APPLICATION_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
} from "../constants/companyOptions";
import {
  companyToFormValues,
  createCompany,
  EMPTY_COMPANY_FORM_VALUES,
  updateCompany,
} from "../lib/companyFactory";
import { companyStorage } from "../lib/storage";
import {
  findDuplicateCompanies,
  type DuplicateCompanyCandidate,
} from "../lib/companyDuplicates";
import type { CompanyFormValues } from "../types/company";

type FieldErrors = Partial<Record<"name" | "jobUrl", string>>;

const inputClassName =
  "mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100";
const textAreaClassName =
  "mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

function validateForm(values: CompanyFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "会社名を入力してください。";
  }

  if (values.jobUrl.trim()) {
    try {
      const url = new URL(values.jobUrl.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.jobUrl = "httpまたはhttpsで始まるURLを入力してください。";
      }
    } catch {
      errors.jobUrl = "有効なURLを入力してください。";
    }
  }

  return errors;
}

export function CompanyFormPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const isEditing = companyId !== undefined;
  const [values, setValues] = useState<CompanyFormValues>({
    ...EMPTY_COMPANY_FORM_VALUES,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [duplicateCandidates, setDuplicateCandidates] = useState<
    DuplicateCompanyCandidate[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (!companyId) {
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

    const company = result.value.find((item) => item.id === companyId);
    if (!company) {
      setLoadError("指定された企業が見つかりません。");
      setIsLoading(false);
      return;
    }

    setValues(companyToFormValues(company));
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
    (field: keyof CompanyFormValues) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const value = event.target.value;
      setValues((current) => ({ ...current, [field]: value }));
      isDirtyRef.current = true;
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
      setStorageError(null);

      if (field === "name" || field === "jobTitle") {
        setDuplicateCandidates([]);
      }
    };

  const saveCompany = (allowDuplicate: boolean) => {
    const errors = validateForm(values);
    setFieldErrors(errors);
    setStorageError(null);

    if (Object.keys(errors).length > 0) {
      setDuplicateCandidates([]);
      return;
    }

    setIsSaving(true);
    const readResult = companyStorage.read();

    if (!readResult.ok) {
      setStorageError(
        "保存済みの企業データを読み込めませんでした。データ保護のため登録を中止しました。",
      );
      setIsSaving(false);
      return;
    }

    const candidates = findDuplicateCompanies(
      readResult.value,
      values.name,
      values.jobTitle,
      companyId,
    );

    if (candidates.length > 0 && !allowDuplicate) {
      setDuplicateCandidates(candidates);
      setIsSaving(false);
      return;
    }

    let nextCompanies;

    if (companyId) {
      const companyIndex = readResult.value.findIndex(
        (company) => company.id === companyId,
      );

      if (companyIndex < 0) {
        setStorageError(
          "編集中の企業が見つからないため、変更を保存できませんでした。",
        );
        setIsSaving(false);
        return;
      }

      nextCompanies = readResult.value.map((company, index) =>
        index === companyIndex ? updateCompany(company, values) : company,
      );
    } else {
      nextCompanies = [...readResult.value, createCompany(values)];
    }

    const writeResult = companyStorage.write(nextCompanies);

    if (!writeResult.ok) {
      setStorageError(
        "企業を保存できませんでした。ブラウザの保存容量や設定を確認して、もう一度お試しください。",
      );
      setIsSaving(false);
      return;
    }

    isDirtyRef.current = false;
    navigate("/companies");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (
      event.key === "Enter" &&
      (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement)
    ) {
      event.preventDefault();
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="企業を編集"
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

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="企業を編集"
          description="企業情報を表示できませんでした。"
        />
        <div
          role="alert"
          className="border border-red-200 bg-red-50 p-5 text-red-800"
        >
          <div className="flex gap-3">
            <AlertCircle aria-hidden="true" className="shrink-0" size={20} />
            <div>
              <h2 className="font-semibold">編集対象を確認できません</h2>
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title={isEditing ? "企業を編集" : "企業を追加"}
        description={
          isEditing
            ? "保存済みの企業情報を変更します。"
            : "応募候補の基本情報を登録します。"
        }
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

      <form
        noValidate
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
        className="space-y-6"
      >
        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-950">基本情報</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-slate-800">
                会社名
                <span className="ml-1 text-red-700" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                type="text"
                required
                autoComplete="organization"
                value={values.name}
                onChange={updateField("name")}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={
                  fieldErrors.name
                    ? "name-error"
                    : undefined
                }
                className={inputClassName}
              />
              {fieldErrors.name && (
                <span
                  id="name-error"
                  className="mt-1.5 block text-sm text-red-700"
                >
                  {fieldErrors.name}
                </span>
              )}
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">
                求人職種
              </span>
              <input
                type="text"
                value={values.jobTitle}
                onChange={updateField("jobTitle")}
                className={inputClassName}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">
                雇用形態
              </span>
              <select
                value={values.employmentType}
                onChange={updateField("employmentType")}
                className={inputClassName}
              >
                <option value="">未選択</option>
                {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-slate-800">
                求人URL
              </span>
              <input
                type="url"
                inputMode="url"
                value={values.jobUrl}
                onChange={updateField("jobUrl")}
                aria-invalid={Boolean(fieldErrors.jobUrl)}
                aria-describedby={
                  fieldErrors.jobUrl ? "job-url-error" : undefined
                }
                placeholder="https://example.com/jobs/123"
                className={inputClassName}
              />
              {fieldErrors.jobUrl && (
                <span
                  id="job-url-error"
                  className="mt-1.5 block text-sm text-red-700"
                >
                  {fieldErrors.jobUrl}
                </span>
              )}
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">
                応募媒体
              </span>
              <input
                type="text"
                list="application-source-options"
                value={values.source}
                onChange={updateField("source")}
                placeholder="選択または自由入力"
                className={inputClassName}
              />
              <datalist id="application-source-options">
                {APPLICATION_SOURCE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </datalist>
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">勤務地</span>
              <input
                type="text"
                autoComplete="address-level2"
                value={values.location}
                onChange={updateField("location")}
                className={inputClassName}
              />
            </label>
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-950">
              応募書類
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              履歴書や応募書類に使用する完成版の文章を保存します。
            </p>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-800">
                志望動機
              </span>
              <textarea
                value={values.motivationStatement}
                onChange={updateField("motivationStatement")}
                className={textAreaClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-800">
                企業別自己PR
              </span>
              <textarea
                value={values.companySelfPromotion}
                onChange={updateField("companySelfPromotion")}
                className={textAreaClassName}
              />
            </label>
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-950">
              求人票・募集要項
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              仕事内容、応募条件、研修、給与、休日、福利厚生など、求人ページの内容を貼り付けてください
            </p>
          </div>

          <label className="block">
            <span className="sr-only">求人票・募集要項の本文</span>
            <textarea
              value={values.jobPostingText}
              onChange={updateField("jobPostingText")}
              className="min-h-72 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              placeholder="求人ページの仕事内容や募集条件を貼り付けてください"
            />
          </label>
        </section>

        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-950">応募状況</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className="text-sm font-medium text-slate-800">
                応募状況
              </span>
              <select
                value={values.applicationStatus}
                onChange={updateField("applicationStatus")}
                className={inputClassName}
              >
                {APPLICATION_STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">応募日</span>
              <input
                type="date"
                value={values.appliedAt}
                onChange={updateField("appliedAt")}
                className={inputClassName}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">
                次の予定
              </span>
              <input
                type="text"
                value={values.nextAction}
                onChange={updateField("nextAction")}
                placeholder="書類を提出する"
                className={inputClassName}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">
                次回予定日時
              </span>
              <input
                type="datetime-local"
                value={values.nextEventAt}
                onChange={updateField("nextEventAt")}
                className={inputClassName}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">
                書類提出期限
              </span>
              <input
                type="date"
                value={values.documentDeadlineDate}
                onChange={updateField("documentDeadlineDate")}
                className={inputClassName}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">
                書類提出期限の時刻（任意）
              </span>
              <input
                type="time"
                value={values.documentDeadlineTime}
                onChange={updateField("documentDeadlineTime")}
                disabled={!values.documentDeadlineDate}
                className={inputClassName}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">
                返信期限
              </span>
              <input
                type="date"
                value={values.responseDeadlineDate}
                onChange={updateField("responseDeadlineDate")}
                className={inputClassName}
              />
            </label>

            <label>
              <span className="text-sm font-medium text-slate-800">
                返信期限の時刻（任意）
              </span>
              <input
                type="time"
                value={values.responseDeadlineTime}
                onChange={updateField("responseDeadlineTime")}
                disabled={!values.responseDeadlineDate}
                className={inputClassName}
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-medium text-slate-800">
              応募管理メモ
            </span>
            <textarea
              value={values.applicationManagementNotes}
              onChange={updateField("applicationManagementNotes")}
              className={textAreaClassName}
              placeholder="返信待ちの状況や次に確認する内容など"
            />
          </label>
        </section>

        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 border-b border-slate-200 pb-4">
            <h2 className="text-base font-semibold text-slate-950">
              良い点・メモ
            </h2>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-800">良い点</span>
              <textarea
                value={values.strengths}
                onChange={updateField("strengths")}
                className={textAreaClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-800">
                気になる点
              </span>
              <textarea
                value={values.concerns}
                onChange={updateField("concerns")}
                className={textAreaClassName}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-800">
                自由メモ
              </span>
              <textarea
                value={values.notes}
                onChange={updateField("notes")}
                className={textAreaClassName}
              />
            </label>
          </div>
        </section>

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => saveCompany(false)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <Save aria-hidden="true" size={18} />
            {isSaving
              ? "保存中..."
              : isEditing
                ? "変更を保存"
                : "企業を登録"}
          </button>
        </div>
      </form>

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
      <DuplicateCompanyDialog
        candidates={duplicateCandidates}
        isEditing={isEditing}
        isSaving={isSaving}
        onCancel={() => setDuplicateCandidates([])}
        onConfirm={() => saveCompany(true)}
      />
    </div>
  );
}
