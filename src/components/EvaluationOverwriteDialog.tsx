import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

interface EvaluationOverwriteDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function EvaluationOverwriteDialog({
  open,
  onCancel,
  onConfirm,
}: EvaluationOverwriteDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelButtonRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4"
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
        aria-labelledby="evaluation-overwrite-title"
        aria-describedby="evaluation-overwrite-description"
        className="w-full max-w-md border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
            <AlertTriangle aria-hidden="true" size={21} />
          </span>
          <div>
            <h2
              id="evaluation-overwrite-title"
              className="text-base font-semibold text-slate-950"
            >
              現在の評価を上書きしますか
            </h2>
            <p
              id="evaluation-overwrite-description"
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              仮評価を反映すると、現在入力されている10項目の点数が置き換わります。保存するまでは企業データへ反映されません。
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
            現在の評価を維持
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-md bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800"
          >
            仮評価で上書き
          </button>
        </div>
      </div>
    </div>
  );
}
