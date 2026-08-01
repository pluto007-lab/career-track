import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import type { CareerTrackBackupV1 } from "../types/backup";

interface ImportBackupDialogProps {
  backup: CareerTrackBackupV1 | null;
  isImporting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function formatExportedAt(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

export function ImportBackupDialog({
  backup,
  isImporting,
  onCancel,
  onConfirm,
}: ImportBackupDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (backup) {
      cancelButtonRef.current?.focus();
    }
  }, [backup]);

  if (!backup) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="import-backup-title"
        aria-describedby="import-backup-description"
        className="w-full max-w-lg border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
            <AlertTriangle aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 id="import-backup-title" className="font-semibold text-slate-950">
              バックアップ内容で置き換えますか
            </h2>
            <p id="import-backup-description" className="mt-2 text-sm leading-6 text-slate-600">
              現在の保存データは、インポート前に自動でダウンロードされます。その後、バックアップ内容ですべて置き換えます。
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">企業数</dt>
            <dd className="mt-1 font-semibold text-slate-950">
              {backup.data.companies.length}社
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">バックアップ日時</dt>
            <dd className="mt-1 font-semibold text-slate-950">
              {formatExportedAt(backup.exportedAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={isImporting}
            onClick={onCancel}
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={isImporting}
            onClick={onConfirm}
            className="h-10 rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImporting ? "インポート中…" : "置き換えてインポート"}
          </button>
        </div>
      </div>
    </div>
  );
}
