import {
  APPLICATION_STATUS_LABELS,
  JUDGMENT_LABELS,
} from "../constants/companyOptions";
import { EVALUATION_ITEMS } from "./evaluation";
import type {
  PrimaryRoleClassification,
  ScreeningWarning,
} from "./jobPostingEvaluation";
import type {
  ApplicationStatus,
  DecisionCompanyScores,
  EvaluationScoreDetail,
  Judgment,
} from "../types/company";

export type JobPostingInclusion = "none" | "excerpt" | "full";
export type EvaluationSaveState = "unrated" | "saved" | "unsaved";

export interface EvaluationConsultationSummaryInput {
  companyName: string;
  jobTitle: string;
  applicationStatus: ApplicationStatus;
  primaryRoleClassification: PrimaryRoleClassification;
  saveState: EvaluationSaveState;
  scores: DecisionCompanyScores;
  scoreDetails?: Partial<
    Record<keyof DecisionCompanyScores, EvaluationScoreDetail>
  >;
  rawScore: number;
  normalJudgment: Judgment;
  finalAutoJudgment: Judgment;
  manualJudgment?: Judgment;
  displayedJudgment: Judgment;
  screeningWarnings: readonly ScreeningWarning[];
  jobPostingText: string;
  jobPostingInclusion: JobPostingInclusion;
}

const JOB_POSTING_EXCERPT_LENGTH = 2000;

function valueOrMissing(value: string): string {
  return value.trim() || "未入力";
}

function uniqueLabels(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function reasonTypeLabel(
  type: EvaluationScoreDetail["reasons"][number]["type"],
): string {
  if (type === "positive") {
    return "加点";
  }
  if (type === "negative") {
    return "減点";
  }
  return "比較";
}

function formatEvaluationItem(
  label: string,
  score: number,
  detail?: EvaluationScoreDetail,
): string[] {
  const lines = [`- ${label}：${score}/10`];

  if (detail?.manuallyAdjusted && detail.autoScore !== undefined) {
    lines.push(`  自動点：${detail.autoScore}/10`);
    lines.push("  手動調整：あり");
  }

  lines.push("  理由：");
  if (!detail || detail.reasons.length === 0) {
    lines.push("  - 保存された評価根拠はありません");
    return lines;
  }

  for (const reason of detail.reasons.slice(0, 3)) {
    const delta =
      reason.delta === 0
        ? ""
        : ` (${reason.delta > 0 ? "+" : ""}${reason.delta})`;
    lines.push(
      `  - ${reasonTypeLabel(reason.type)}：${reason.label}${delta}`,
    );
    if (reason.evidence) {
      lines.push(`  - 根拠：${reason.evidence}`);
    }
  }

  return lines;
}

function formatSummaryList(values: readonly string[]): string[] {
  const unique = uniqueLabels(values).slice(0, 5);
  return unique.length > 0
    ? unique.map((value) => `  - ${value}`)
    : ["  - 情報なし"];
}

function formatJobPosting(
  text: string,
  inclusion: JobPostingInclusion,
): string[] {
  if (inclusion === "none") {
    return [];
  }

  const normalized = text.trim();
  if (!normalized) {
    return ["", "【求人票原文】", "未入力"];
  }

  if (
    inclusion === "excerpt" &&
    normalized.length > JOB_POSTING_EXCERPT_LENGTH
  ) {
    return [
      "",
      "【求人票原文】",
      normalized.slice(0, JOB_POSTING_EXCERPT_LENGTH),
      "",
      `※求人票原文は${JOB_POSTING_EXCERPT_LENGTH.toLocaleString("ja-JP")}文字で省略されています`,
    ];
  }

  return ["", "【求人票原文】", normalized];
}

export function buildEvaluationConsultationSummary(
  input: EvaluationConsultationSummaryInput,
): string {
  const saveStateLabels: Record<EvaluationSaveState, string> = {
    unrated: "未評価",
    saved: "保存済み",
    unsaved: "未保存の変更あり",
  };
  const lines: string[] = [
    "【企業情報】",
    `企業名：${valueOrMissing(input.companyName)}`,
    `求人職種：${valueOrMissing(input.jobTitle)}`,
    `応募状況：${APPLICATION_STATUS_LABELS[input.applicationStatus]}`,
    "",
    "【中心業務分類】",
    `中心業務分類：${input.primaryRoleClassification.label}`,
    "判定根拠：",
    ...(input.primaryRoleClassification.evidence.length > 0
      ? input.primaryRoleClassification.evidence
          .slice(0, 3)
          .map((evidence) => `- 「${evidence}」`)
      : ["- 中心業務分類の根拠を抽出できませんでした"]),
    "",
    "【自動評価】",
    `評価保存状態：${saveStateLabels[input.saveState]}`,
    `素点：${input.rawScore}/100`,
    `通常判定：${JUDGMENT_LABELS[input.normalJudgment]}`,
    `最終自動判定：${JUDGMENT_LABELS[input.finalAutoJudgment]}`,
    `手動判定：${
      input.manualJudgment
        ? JUDGMENT_LABELS[input.manualJudgment]
        : "未設定"
    }`,
    `最終表示判定：${JUDGMENT_LABELS[input.displayedJudgment]}`,
    "",
    "【評価項目】",
  ];

  for (const item of EVALUATION_ITEMS) {
    lines.push(
      ...formatEvaluationItem(
        item.label,
        input.scores[item.key],
        input.scoreDetails?.[item.key],
      ),
      "",
    );
  }

  lines.push("【足切り・注意点】");
  if (input.screeningWarnings.length === 0) {
    lines.push("特になし");
  } else {
    for (const warning of input.screeningWarnings) {
      lines.push(`- ${warning.label}`);
      lines.push(`  理由：${warning.reason}`);
    }
  }

  const details = Object.values(input.scoreDetails ?? {});
  const positiveReasons = details.flatMap((detail) =>
    (detail?.reasons ?? [])
      .filter((reason) => reason.type === "positive")
      .map((reason) => reason.label),
  );
  const negativeReasons = [
    ...details.flatMap((detail) =>
      (detail?.reasons ?? [])
        .filter((reason) => reason.type === "negative")
        .map((reason) => reason.label),
    ),
    ...input.screeningWarnings.map((warning) => warning.label),
  ];
  const neutralReasons = details.flatMap((detail) =>
    (detail?.reasons ?? [])
      .filter((reason) => reason.type === "neutral")
      .map((reason) => reason.label),
  );

  lines.push(
    "",
    "【総合所見】",
    "- 強み：",
    ...formatSummaryList(positiveReasons),
    "- 懸念点：",
    ...formatSummaryList(negativeReasons),
    "- 判断に不足している情報：",
    ...formatSummaryList(neutralReasons),
    "",
    "【AIへの相談文】",
    "この求人について、以下を検討してください。",
    "",
    "1. 私の希望職種・キャリア目標に合っているか",
    "2. 応募する、保留、辞退のどれが妥当か",
    "3. 自動評価に見落としや過大評価がないか",
    "4. 応募前に確認すべき点は何か",
    ...formatJobPosting(
      input.jobPostingText,
      input.jobPostingInclusion,
    ),
  );

  return lines.join("\n").trim();
}
