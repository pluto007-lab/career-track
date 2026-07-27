import type {
  ApplicationManagement,
  Company,
  DeadlineValue,
} from "../types/company";

export type ApplicationSort =
  | "next_asc"
  | "next_desc"
  | "applied_desc"
  | "applied_asc";

export type ScheduleState =
  | "overdue"
  | "today"
  | "within_seven_days"
  | "future";

const JST_OFFSET_MINUTES = 9 * 60;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function jstLocalDateTimeToUtcIso(value: string): string | undefined {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return undefined;
  }

  const [, year, month, day, hour, minute] = match;
  const utcMilliseconds =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    ) -
    JST_OFFSET_MINUTES * 60 * 1000;

  const date = new Date(utcMilliseconds);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function utcIsoToJstLocalDateTime(value?: string): string {
  if (!value) {
    return "";
  }

  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) {
    return "";
  }

  const jst = new Date(milliseconds + JST_OFFSET_MINUTES * 60 * 1000);
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(
    jst.getUTCDate(),
  )}T${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
}

export function deadlineToUtcMilliseconds(
  deadline?: DeadlineValue,
): number | undefined {
  if (!deadline) {
    return undefined;
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(deadline.date);
  const timeMatch = deadline.time
    ? /^(\d{2}):(\d{2})$/.exec(deadline.time)
    : null;
  if (!dateMatch || (deadline.time && !timeMatch)) {
    return undefined;
  }

  const [, year, month, day] = dateMatch;
  const hour = timeMatch ? Number(timeMatch[1]) : 23;
  const minute = timeMatch ? Number(timeMatch[2]) : 59;
  const second = timeMatch ? 0 : 59;
  const millisecond = timeMatch ? 0 : 999;

  return (
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      hour,
      minute,
      second,
      millisecond,
    ) -
    JST_OFFSET_MINUTES * 60 * 1000
  );
}

export function createLegacyApplicationManagement(
  nextActionDate?: string,
  documentDeadline?: string,
): ApplicationManagement {
  const nextEventAt = nextActionDate
    ? jstLocalDateTimeToUtcIso(`${nextActionDate}T00:00`)
    : undefined;

  return {
    nextEventAt,
    documentDeadline: documentDeadline
      ? { date: documentDeadline }
      : undefined,
    responseDeadline: undefined,
    notes: "",
  };
}

export function getScheduleState(
  value: number,
  now = Date.now(),
): ScheduleState {
  const currentJstDay = Math.floor(
    (now + JST_OFFSET_MINUTES * 60 * 1000) / DAY_MILLISECONDS,
  );
  const targetJstDay = Math.floor(
    (value + JST_OFFSET_MINUTES * 60 * 1000) / DAY_MILLISECONDS,
  );
  const dayDifference = targetJstDay - currentJstDay;

  if (value < now) {
    return "overdue";
  }
  if (dayDifference === 0) {
    return "today";
  }
  if (dayDifference <= 7) {
    return "within_seven_days";
  }
  return "future";
}

export function getCompanyScheduleStates(
  company: Company,
  now = Date.now(),
): ScheduleState[] {
  const timestamps = [
    company.applicationManagement.nextEventAt
      ? Date.parse(company.applicationManagement.nextEventAt)
      : undefined,
    deadlineToUtcMilliseconds(
      company.applicationManagement.documentDeadline,
    ),
    deadlineToUtcMilliseconds(
      company.applicationManagement.responseDeadline,
    ),
  ].filter(
    (value): value is number =>
      value !== undefined && !Number.isNaN(value),
  );

  return timestamps.map((value) => getScheduleState(value, now));
}

function compareOptionalValues(
  left: number | undefined,
  right: number | undefined,
  direction: "asc" | "desc",
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }
  if (left === undefined) {
    return 1;
  }
  if (right === undefined) {
    return -1;
  }
  return direction === "asc" ? left - right : right - left;
}

function parseOptionalDate(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const milliseconds = Date.parse(value);
  return Number.isNaN(milliseconds) ? undefined : milliseconds;
}

export function sortApplicationCompanies(
  companies: Company[],
  sort: ApplicationSort,
): Company[] {
  return [...companies].sort((left, right) => {
    const isNextSort = sort === "next_asc" || sort === "next_desc";
    const leftValue = isNextSort
      ? parseOptionalDate(left.applicationManagement.nextEventAt)
      : parseOptionalDate(
          left.appliedAt ? `${left.appliedAt}T00:00:00Z` : undefined,
        );
    const rightValue = isNextSort
      ? parseOptionalDate(right.applicationManagement.nextEventAt)
      : parseOptionalDate(
          right.appliedAt ? `${right.appliedAt}T00:00:00Z` : undefined,
        );
    const direction =
      sort === "next_asc" || sort === "applied_asc" ? "asc" : "desc";
    const compared = compareOptionalValues(leftValue, rightValue, direction);

    return compared || left.name.localeCompare(right.name, "ja");
  });
}

export function formatJstDateTime(value?: string): string {
  if (!value) {
    return "未設定";
  }

  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) {
    return "未設定";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(milliseconds);
}

export function formatDeadline(deadline?: DeadlineValue): string {
  if (!deadline) {
    return "未設定";
  }
  return deadline.time
    ? `${deadline.date} ${deadline.time}`
    : `${deadline.date}（当日23:59まで）`;
}
