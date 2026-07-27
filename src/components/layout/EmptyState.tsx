import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-md bg-slate-100 text-slate-600">
        <Icon aria-hidden="true" size={22} />
      </span>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
