import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
}: UnsavedChangesDialogProps) {
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      stayButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4"
      role="presentation"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-dialog-title"
        aria-describedby="unsaved-dialog-description"
        className="w-full max-w-md border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
            <AlertTriangle aria-hidden="true" size={21} />
          </span>
          <div>
            <h2
              id="unsaved-dialog-title"
              className="text-base font-semibold text-slate-950"
            >
              入力途中の内容があります
            </h2>
            <p
              id="unsaved-dialog-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              このページを離れると、保存していない変更は失われます。
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onLeave}
            className="h-10 rounded-md border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            変更を破棄して移動
          </button>
          <button
            ref={stayButtonRef}
            type="button"
            onClick={onStay}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            編集を続ける
          </button>
        </div>
      </div>
    </div>
  );
}
