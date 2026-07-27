import type {
  ApplicationStatus,
  Company,
} from "../types/company";

export interface DashboardSummary {
  totalCompanies: number;
  appliedCompanies: number;
  interviewCompanies: number;
  offeredCompanies: number;
}

export interface DashboardTask {
  companyId: string;
  companyName: string;
  action: string;
  dueDate: string;
  dayDifference: number;
}

const APPLIED_STATUSES: ReadonlySet<ApplicationStatus> = new Set([
  "applied",
  "document_screening",
  "document_passed",
  "first_interview_scheduled",
  "first_interview_completed",
  "second_interview_scheduled",
  "second_interview_completed",
  "final_interview_scheduled",
  "final_interview_completed",
  "offer",
  "rejected",
  "withdrawn",
]);

const INTERVIEW_SCHEDULED_STATUSES: ReadonlySet<ApplicationStatus> =
  new Set([
    "first_interview_scheduled",
    "second_interview_scheduled",
    "final_interview_scheduled",
  ]);

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function toDayNumber(date: CalendarDate): number {
  return Date.UTC(date.year, date.month - 1, date.day) /
    MILLISECONDS_PER_DAY;
}

function getLocalCalendarDate(date: Date): CalendarDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function createDashboardSummary(
  companies: readonly Company[],
): DashboardSummary {
  const activeCompanies = companies.filter(
    (company) => !company.archived,
  );

  return {
    totalCompanies: activeCompanies.length,
    appliedCompanies: activeCompanies.filter((company) =>
      APPLIED_STATUSES.has(company.applicationStatus),
    ).length,
    interviewCompanies: activeCompanies.filter((company) =>
      INTERVIEW_SCHEDULED_STATUSES.has(company.applicationStatus),
    ).length,
    offeredCompanies: activeCompanies.filter(
      (company) => company.applicationStatus === "offer",
    ).length,
  };
}

export function createDashboardTasks(
  companies: readonly Company[],
  currentDate = new Date(),
): DashboardTask[] {
  const currentDayNumber = toDayNumber(
    getLocalCalendarDate(currentDate),
  );

  return companies
    .filter((company) => !company.archived)
    .flatMap((company): DashboardTask[] => {
      const action = company.nextAction?.trim();
      const dueDate = company.nextActionDate?.trim();

      if (!action || !dueDate) {
        return [];
      }

      const parsedDueDate = parseCalendarDate(dueDate);
      if (!parsedDueDate) {
        return [];
      }

      return [
        {
          companyId: company.id,
          companyName: company.name,
          action,
          dueDate,
          dayDifference:
            toDayNumber(parsedDueDate) - currentDayNumber,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.dayDifference - right.dayDifference ||
        left.companyName.localeCompare(right.companyName, "ja"),
    );
}

export function formatDashboardDueStatus(
  dayDifference: number,
): string {
  if (dayDifference < 0) {
    return "期限超過";
  }
  if (dayDifference === 0) {
    return "今日";
  }
  if (dayDifference === 1) {
    return "明日";
  }
  if (dayDifference <= 7) {
    return `あと${dayDifference}日`;
  }
  return "";
}

export function formatDashboardDate(value: string): string {
  const date = parseCalendarDate(value);
  if (!date) {
    return value;
  }
  return `${date.year}年${date.month}月${date.day}日`;
}
