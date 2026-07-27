import type {
  Company,
  DecisionCompanyScores,
  Judgment,
} from "../types/company";

export interface EvaluationItemDefinition {
  key: keyof DecisionCompanyScores;
  label: string;
  maxScore: number;
  weight?: number;
}

export const EVALUATION_ITEMS: readonly EvaluationItemDefinition[] = [
  { key: "jobFit", label: "やりたい仕事内容との一致", maxScore: 10 },
  { key: "careerFit", label: "将来のキャリアとの一致", maxScore: 10 },
  { key: "training", label: "研修・教育制度", maxScore: 10 },
  { key: "growthEnvironment", label: "成長できる環境", maxScore: 10 },
  {
    key: "webDevelopment",
    label: "Webサービス・Web開発との関連性",
    maxScore: 10,
  },
  { key: "aiFit", label: "AI活用との相性", maxScore: 10 },
  { key: "gitTeamDevelopment", label: "Git・チーム開発", maxScore: 10 },
  { key: "assignmentFlexibility", label: "配属の柔軟性", maxScore: 10 },
  {
    key: "workLifeBalance",
    label: "ワークライフバランス",
    maxScore: 10,
  },
  { key: "compensation", label: "給与・待遇", maxScore: 10 },
];

export const MAX_RAW_EVALUATION_SCORE = EVALUATION_ITEMS.reduce(
  (total, item) => total + item.maxScore,
  0,
);

function sanitizeScore(value: unknown, maxScore: number): number {
  const numericValue =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : 0;

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(maxScore, Math.max(0, Math.round(numericValue)));
}

export function sanitizeDecisionScores(
  scores: DecisionCompanyScores,
): DecisionCompanyScores {
  const sanitized = { ...scores };

  for (const item of EVALUATION_ITEMS) {
    sanitized[item.key] = sanitizeScore(
      scores[item.key],
      item.maxScore,
    );
  }

  return sanitized;
}

export function calculateRawScore(
  scores: DecisionCompanyScores,
): number {
  const sanitized = sanitizeDecisionScores(scores);
  return EVALUATION_ITEMS.reduce(
    (total, item) => total + sanitized[item.key],
    0,
  );
}

export function calculateTotalScore(
  scores: DecisionCompanyScores,
): number {
  const rawScore = calculateRawScore(scores);
  return Math.round((rawScore / MAX_RAW_EVALUATION_SCORE) * 100);
}

export function calculateAutoJudgment(totalScore: number): Judgment {
  const safeScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  if (safeScore >= 80) {
    return "green";
  }
  if (safeScore >= 65) {
    return "yellow";
  }
  if (safeScore >= 50) {
    return "orange";
  }
  return "red";
}

const JUDGMENT_RANK: Record<Judgment, number> = {
  green: 3,
  yellow: 2,
  orange: 1,
  red: 0,
};

export function capJudgment(
  judgment: Judgment,
  caps: readonly Judgment[],
): Judgment {
  return caps.reduce(
    (current, cap) =>
      JUDGMENT_RANK[current] > JUDGMENT_RANK[cap] ? cap : current,
    judgment,
  );
}

export function resolveCompanyJudgment(
  company: Company,
): Judgment | null {
  const evaluation = company.decisionEvaluation;
  if (evaluation.status === "unrated") {
    return null;
  }

  return evaluation.judgmentSelection.mode === "manual"
    ? evaluation.judgmentSelection.judgment
    : evaluation.autoJudgment;
}
