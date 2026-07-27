import { AlertTriangle, RotateCcw } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function ErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "予期しないエラーが発生しました。";

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-md bg-red-50 text-red-700">
          <AlertTriangle aria-hidden="true" size={24} />
        </span>
        <h1 className="mt-4 text-xl font-bold">画面を表示できませんでした</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <RotateCcw aria-hidden="true" size={17} />
          再読み込み
        </button>
      </div>
    </main>
  );
}
