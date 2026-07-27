import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-teal-700">404</p>
      <h1 className="mt-2 text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        URLが変更されたか、ページが削除された可能性があります。
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-50"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        ダッシュボードへ
      </Link>
    </div>
  );
}
