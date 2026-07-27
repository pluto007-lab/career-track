import { Archive } from "lucide-react";
import { useEffect, useRef } from "react";

interface ArchiveCompanyDialogProps {
  companyName: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ArchiveCompanyDialog({
  companyName,
  onCancel,
  onConfirm,
}: ArchiveCompanyDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (companyName) {
      cancelButtonRef.current?.focus();
    }
  }, [companyName]);

  if (!companyName) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="archive-company-title"
        aria-describedby="archive-company-description"
        className="w-full max-w-md border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700">
            <Archive aria-hidden="true" size={20} />
          </span>
          <div>
            <h2
              id="archive-company-title"
              className="text-base font-semibold text-slate-950"
            >
              企業をアーカイブしますか
            </h2>
            <p
              id="archive-company-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              「{companyName}」をアーカイブしますか？
              通常の企業一覧には表示されなくなりますが、後から元に戻せます。
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-md bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900"
          >
            アーカイブする
          </button>
        </div>
      </div>
    </div>
  );
}
