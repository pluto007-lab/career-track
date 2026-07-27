import {
  AlertCircle,
  CheckCircle2,
  Save,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";
import { PageHeader } from "../components/layout/PageHeader";
import { UnsavedChangesDialog } from "../components/UnsavedChangesDialog";
import { profileStorage } from "../lib/storage";
import {
  APPLICANT_PROFILE_FIELDS,
  EMPTY_APPLICANT_PROFILE,
  type ApplicantProfile,
} from "../types/applicantProfile";

type ProfileSaveStatus = "idle" | "saving" | "success" | "error";

function trimProfile(profile: ApplicantProfile): ApplicantProfile {
  const trimmed = { ...profile };

  for (const { key } of APPLICANT_PROFILE_FIELDS) {
    trimmed[key] = profile[key].trim();
  }

  return trimmed;
}

export function ApplicantProfilePage() {
  const [profile, setProfile] = useState<ApplicantProfile>({
    ...EMPTY_APPLICANT_PROFILE,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] =
    useState<ProfileSaveStatus>("idle");
  const [saveErrorMessage, setSaveErrorMessage] =
    useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    const result = profileStorage.read();

    if (!result.ok) {
      setLoadError(
        "応募者プロフィールを読み込めませんでした。データ保護のため編集を開始できません。",
      );
      setIsLoading(false);
      return;
    }

    setProfile(result.value);
    setIsLoading(false);
  }, []);

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
    (field: keyof ApplicantProfile) =>
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setProfile((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      isDirtyRef.current = true;
      setIsDirty(true);
      setSaveStatus("idle");
      setSaveErrorMessage(null);
    };

  const saveProfile = async () => {
    if (!isDirty || saveStatus === "saving") {
      return;
    }

    setSaveStatus("saving");
    setSaveErrorMessage(null);

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    const normalizedProfile = trimProfile(profile);
    const result = profileStorage.write(normalizedProfile);

    if (!result.ok) {
      setSaveErrorMessage(
        "プロフィールの保存に失敗しました。時間をおいてもう一度お試しください。入力内容はこの画面に保持されています。",
      );
      setSaveStatus("error");
      return;
    }

    setProfile(normalizedProfile);
    isDirtyRef.current = false;
    setIsDirty(false);
    setSaveStatus("success");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="応募者プロフィール"
          description="志望動機で共通利用する情報を管理します。"
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
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
        <PageHeader
          title="応募者プロフィール"
          description="志望動機で共通利用する情報を管理します。"
        />
        <div
          role="alert"
          className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={18}
          />
          <span>{loadError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title="応募者プロフィール"
        description="志望動機で共通利用する情報を管理します。"
      />

      <section className="border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="grid size-10 place-items-center rounded-md bg-teal-50 text-teal-700">
            <UserRound aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              共通情報
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              入力した内容は企業ごとの志望動機準備で参照されます。
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {APPLICANT_PROFILE_FIELDS.map(({ key, label }) => (
            <label key={key} className="block">
              <span className="text-sm font-medium text-slate-800">
                {label}
              </span>
              <textarea
                value={profile[key]}
                onChange={updateField(key)}
                className="mt-2 min-h-32 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          ))}
        </div>
      </section>

      <div
        aria-live="polite"
        className="mt-6"
      >
        {saveStatus === "idle" && isDirty && (
          <div
            role="status"
            className="flex gap-3 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
            />
            <span>未保存の変更があります。</span>
          </div>
        )}

        {saveStatus === "saving" && (
          <div
            role="status"
            className="flex gap-3 border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-800"
          >
            <Save
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
            />
            <span>応募者プロフィールを保存しています。</span>
          </div>
        )}

        {saveStatus === "success" && (
          <div
            role="status"
            className="flex gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
          >
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
            />
            <span>応募者プロフィールを保存しました。</span>
          </div>
        )}

        {saveStatus === "error" && saveErrorMessage && (
          <div
            role="alert"
            className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={18}
            />
            <span>{saveErrorMessage}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end border-t border-slate-200 pt-5">
        <button
          type="button"
          disabled={saveStatus === "saving" || !isDirty}
          onClick={saveProfile}
          className="inline-flex h-11 w-full min-w-44 items-center justify-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Save aria-hidden="true" size={18} />
          {saveStatus === "saving"
            ? "保存中…"
            : saveStatus === "success"
              ? "保存済み"
              : saveStatus === "error"
                ? "もう一度保存"
                : "プロフィールを保存"}
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
    </div>
  );
}
