import {
  AlertCircle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  Upload,
} from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { ImportBackupDialog } from "../components/ImportBackupDialog";
import { PageHeader } from "../components/layout/PageHeader";
import {
  createBackupFileName,
  createCareerTrackBackup,
  downloadBackup,
  parseCareerTrackBackup,
  readCareerTrackSnapshot,
  replaceWithBackup,
} from "../lib/backup";
import type { CareerTrackBackupV1 } from "../types/backup";

type ActionStatus = "idle" | "success" | "error";

export function DataManagementPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] =
    useState<CareerTrackBackupV1 | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const showError = (text: string) => {
    setStatus("error");
    setMessage(text);
  };

  const exportData = () => {
    const snapshot = readCareerTrackSnapshot();
    if (!snapshot.ok) {
      showError(snapshot.message);
      return;
    }
    const result = downloadBackup(createCareerTrackBackup(snapshot.value));
    if (!result.ok) {
      showError(result.message);
      return;
    }
    setStatus("success");
    setMessage("バックアップをダウンロードしました。");
  };

  const selectImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setStatus("idle");
    setMessage(null);

    try {
      const parsed = parseCareerTrackBackup(await file.text());
      if (!parsed.ok) {
        showError(parsed.message);
        return;
      }
      setPendingBackup(parsed.value);
    } catch {
      showError("選択したファイルを読み込めませんでした。");
    }
  };

  const confirmImport = async () => {
    if (!pendingBackup || isImporting) {
      return;
    }
    setIsImporting(true);
    setStatus("idle");
    setMessage(null);

    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    const current = readCareerTrackSnapshot();
    if (!current.ok) {
      showError("現在のデータを安全に読み込めないため、インポートを中止しました。");
      setIsImporting(false);
      return;
    }

    const automaticBackup = createCareerTrackBackup(current.value);
    const backupDownload = downloadBackup(
      automaticBackup,
      createBackupFileName().replace(".json", "-before-import.json"),
    );
    if (!backupDownload.ok) {
      showError("現在データの自動バックアップに失敗したため、インポートを中止しました。保存データは変更されていません。");
      setIsImporting(false);
      return;
    }

    const result = replaceWithBackup(pendingBackup, current.value);
    if (!result.ok) {
      showError(result.message);
      setIsImporting(false);
      return;
    }

    setPendingBackup(null);
    setStatus("success");
    setMessage("バックアップをインポートしました。画面を再読み込みします。");
    window.setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
      <PageHeader
        title="データ管理"
        description="就活データをJSONファイルでバックアップし、別の環境へ安全に移せます。"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-50 text-teal-700">
              <Download aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">エクスポート</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                企業、プロフィール、アプリ設定、一覧設定を1つのJSONファイルに保存します。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportData}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 sm:w-auto"
          >
            <DatabaseBackup aria-hidden="true" size={18} />
            バックアップを作成
          </button>
        </section>

        <section className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700">
              <Upload aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">インポート</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                正式なバックアップファイルで現在の保存データを置き換えます。マージは行いません。
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={selectImportFile}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto"
          >
            <Upload aria-hidden="true" size={18} />
            JSONファイルを選択
          </button>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            バックアップには求人票やプロフィールなどの個人情報が含まれます。ファイルの保管場所にご注意ください。
          </p>
        </section>
      </div>

      <div aria-live="polite" className="mt-5">
        {status === "success" && message && (
          <div role="status" className="flex gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 aria-hidden="true" className="shrink-0" size={18} />
            <span>{message}</span>
          </div>
        )}
        {status === "error" && message && (
          <div role="alert" className="flex gap-3 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
            <AlertCircle aria-hidden="true" className="shrink-0" size={18} />
            <span>{message}</span>
          </div>
        )}
      </div>

      <ImportBackupDialog
        backup={pendingBackup}
        isImporting={isImporting}
        onCancel={() => setPendingBackup(null)}
        onConfirm={confirmImport}
      />
    </div>
  );
}
