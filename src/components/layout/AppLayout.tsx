import {
  Building2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { settingsStorage } from "../../lib/storage";

const navigation = [
  { to: "/", label: "ダッシュボード", icon: LayoutDashboard, end: true },
  { to: "/companies", label: "企業一覧", icon: Building2, end: false },
  {
    to: "/applications",
    label: "応募管理",
    icon: ClipboardList,
    end: true,
  },
  { to: "/companies/new", label: "企業を追加", icon: Plus, end: true },
  {
    to: "/settings/profile",
    label: "応募者プロフィール",
    icon: UserRound,
    end: true,
  },
];

interface NavigationProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

function Navigation({
  collapsed = false,
  onNavigate,
}: NavigationProps) {
  return (
    <nav aria-label="メインナビゲーション" className="space-y-1">
      {navigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={collapsed ? label : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              "group relative flex h-11 items-center rounded-md text-sm font-medium transition-colors",
              collapsed
                ? "justify-center px-0"
                : "gap-3 px-3",
              isActive
                ? "bg-teal-50 text-teal-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            ].join(" ")
          }
        >
          <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
          {!collapsed && <span>{label}</span>}
          {collapsed && (
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full z-30 ml-3 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [initialSidebarPreference] = useState(() => {
    const result = settingsStorage.read();
    return {
      collapsed: result.ok ? result.value.sidebarCollapsed : false,
      loadFailed: !result.ok,
    };
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    initialSidebarPreference.collapsed,
  );
  const [settingsError, setSettingsError] = useState<string | null>(
    initialSidebarPreference.loadFailed
      ? "サイドバーの表示設定を読み込めませんでした。"
      : null,
  );

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const toggleSidebar = () => {
    const nextCollapsed = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextCollapsed);

    const settingsResult = settingsStorage.read();
    if (!settingsResult.ok) {
      setSettingsError(
        "サイドバーの表示設定を保存できませんでした。",
      );
      return;
    }

    const writeResult = settingsStorage.write({
      ...settingsResult.value,
      sidebarCollapsed: nextCollapsed,
    });
    if (!writeResult.ok) {
      setSettingsError(
        "サイドバーの表示設定を保存できませんでした。",
      );
      return;
    }

    setSettingsError(null);
  };

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-20 hidden border-r border-slate-200 bg-white py-6 transition-[width] duration-200 lg:block",
          isSidebarCollapsed ? "w-20 px-3" : "w-64 px-4",
        ].join(" ")}
      >
        <div
          className={[
            "mb-8 flex gap-3",
            isSidebarCollapsed
              ? "flex-col items-center"
              : "items-start justify-between",
          ].join(" ")}
        >
          <NavLink
            to="/"
            aria-label={isSidebarCollapsed ? "Career Track" : undefined}
            className={[
              "flex min-w-0 items-center",
              isSidebarCollapsed ? "justify-center" : "gap-3 px-2",
            ].join(" ")}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-teal-700 text-white">
              <Building2 aria-hidden="true" size={19} />
            </span>
            {!isSidebarCollapsed && (
              <span className="min-w-0">
                <span className="block text-base font-bold">
                  Career Track
                </span>
                <span className="block whitespace-nowrap text-xs text-slate-500">
                  企業比較・応募管理
                </span>
              </span>
            )}
          </NavLink>
          <button
            type="button"
            aria-label={
              isSidebarCollapsed
                ? "サイドバーを展開"
                : "サイドバーを縮小"
            }
            aria-expanded={!isSidebarCollapsed}
            onClick={toggleSidebar}
            className="grid size-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            {isSidebarCollapsed ? (
              <ChevronRight aria-hidden="true" size={19} />
            ) : (
              <ChevronLeft aria-hidden="true" size={19} />
            )}
          </button>
        </div>
        <Navigation collapsed={isSidebarCollapsed} />
      </aside>

      <header
        className={[
          "sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 transition-[margin] duration-200 lg:px-8",
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="メニューを開く"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(true)}
          className="grid size-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu aria-hidden="true" size={21} />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <span className="grid size-8 place-items-center rounded-md bg-teal-700 text-white">
            <Building2 aria-hidden="true" size={17} />
          </span>
          <span className="font-bold">Career Track</span>
        </div>
        <button
          type="button"
          aria-label="検索"
          title="検索"
          disabled
          className="grid size-10 place-items-center rounded-md text-slate-400 disabled:cursor-not-allowed"
        >
          <Search aria-hidden="true" size={20} />
        </button>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="absolute inset-0 bg-slate-950/30"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="relative h-full w-72 bg-white p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-bold">メニュー</span>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setIsMenuOpen(false)}
                className="grid size-10 place-items-center rounded-md hover:bg-slate-100"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <Navigation onNavigate={() => setIsMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main
        className={[
          "pb-24 transition-[margin] duration-200 lg:pb-8",
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64",
          isSidebarCollapsed
            ? "lg:[&>div]:max-w-none lg:[&>div]:px-4 2xl:[&>div]:px-6"
            : "",
        ].join(" ")}
      >
        {settingsError && (
          <div
            role="alert"
            className="mx-4 mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-6 lg:mx-8"
          >
            {settingsError}
          </div>
        )}
        <Outlet />
      </main>

      <nav
        aria-label="モバイルナビゲーション"
        className="fixed inset-x-0 bottom-0 z-20 grid h-18 grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {navigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-medium",
                isActive ? "text-teal-700" : "text-slate-500",
              ].join(" ")
            }
          >
            <Icon aria-hidden="true" size={19} />
            <span className="text-center text-[10px] leading-tight">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
