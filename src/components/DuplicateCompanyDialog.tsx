import { AlertTriangle } from "lucide-react";
import {
  APPLICATION_STATUS_LABELS,
} from "../constants/companyOptions";
import type { DuplicateCompanyCandidate } from "../lib/companyDuplicates";

const REASON_LABELS = {
  company_and_job: "企業名と求人職種が一致",
  company_name: "企業名が一致",
  company_name_without_legal_form: "株式会社などの表記を除くと一致",
} as const;

interface DuplicateCompanyDialogProps {
  candidates: DuplicateCompanyCandidate[];
  isEditing: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DuplicateCompanyDialog({
  candidates,
  isEditing,
  isSaving,
  onCancel,
  onConfirm,
}: DuplicateCompanyDialogProps) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-company-title"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
    >
      <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-md bg-white p-5 shadow-xl sm:p-6">
        <div className="flex gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-amber-700"
            size={21}
          />
          <div>
            <h2
              id="duplicate-company-title"
              className="font-semibold text-slate-950"
            >
              同じ企業名の登録があります
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              同じ企業の別求人であれば、そのまま登録できます。
            </p>
          </div>
        </div>

        <ul className="mt-5 divide-y divide-slate-200 border border-slate-200">
          {candidates.map(({ company, reason }) => (
            <li key={company.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-950">
                    {company.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {company.jobTitle || "求人職種未設定"}
                  </p>
                </div>
                <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {APPLICATION_STATUS_LABELS[company.applicationStatus]}
                </span>
              </div>
              <p className="mt-2 text-xs text-amber-800">
                {REASON_LABELS[reason]}
                {company.archived ? "・アーカイブ済み" : ""}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            入力に戻る
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onConfirm}
            className="h-10 rounded-md bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEditing ? "それでも保存する" : "それでも登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}
