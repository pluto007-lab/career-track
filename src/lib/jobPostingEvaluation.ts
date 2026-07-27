import type { ApplicantProfile } from "../types/applicantProfile";
import type {
  DecisionCompanyScores,
  EvaluationReason,
  EvaluationScoreDetail,
  Judgment,
} from "../types/company";

export const MIN_JOB_POSTING_LENGTH = 100;

export type EvaluationScoreDetails = Record<
  keyof DecisionCompanyScores,
  EvaluationScoreDetail
>;

export type ScreeningCondition =
  | "cloud_centered"
  | "infrastructure_operations"
  | "night_shift"
  | "desired_role_mismatch"
  | "required_experience_gap";

export interface ScreeningWarning {
  condition: ScreeningCondition;
  label: string;
  reason: string;
  judgmentCap: Judgment;
}

export interface DraftEvaluation {
  scores: DecisionCompanyScores;
  scoreDetails: EvaluationScoreDetails;
  screeningWarnings: ScreeningWarning[];
}

export interface JobPostingEvaluationContext {
  jobTitle: string;
  desiredRole: string;
  careerPriorities: string;
  skillsAndTools: string;
  workExperience: string;
  portfolioExperience: string;
}

export interface JobPostingEvaluator {
  evaluate(
    text: string,
    context?: JobPostingEvaluationContext,
  ): DraftEvaluation;
}

interface TextRule {
  patterns: readonly RegExp[];
  excludedPatterns?: readonly RegExp[];
  delta: number;
  reason: string;
}

interface ItemRuleSet {
  positive: readonly TextRule[];
  negative: readonly TextRule[];
}

const COMMON_NEGATIONS = [
  /(?:なし|ありません|行いません|使用しません|不可|禁止)/i,
  /(?:必須では(?:ない|ありません)|経験不問)/i,
];

const RULES: Record<keyof DecisionCompanyScores, ItemRuleSet> = {
  jobFit: {
    positive: [
      {
        patterns: [
          /フロントエンド(?:エンジニア|開発|実装)/i,
          /(?:web|ウェブ)(?:アプリ|サービス).{0,16}(?:開発|改善)/i,
          /(?:画面|ui)[・\s]*(?:設計|開発|実装)/i,
        ],
        excludedPatterns: COMMON_NEGATIONS,
        delta: 3,
        reason: "Web・フロントエンド開発を担当する記載があります",
      },
      {
        patterns: [/要件定義|設計から運用まで|企画.{0,10}開発/i],
        delta: 1,
        reason: "開発工程へ幅広く関われる記載があります",
      },
    ],
    negative: [
      {
        patterns: [
          /(?:監視|ヘルプデスク|コールセンター)(?:が中心|を担当|から開始)/i,
          /開発業務(?:は)?(?:なし|ありません)/i,
        ],
        delta: -4,
        reason: "希望する開発業務と異なる可能性があります",
      },
    ],
  },
  careerFit: {
    positive: [
      {
        patterns: [
          /キャリアパス.{0,20}(?:明確|選択|支援)/i,
          /キャリア.{0,12}(?:相談|面談|支援)/i,
          /上流工程.{0,12}(?:挑戦|経験)/i,
        ],
        delta: 2,
        reason: "将来のキャリア形成を支援する記載があります",
      },
      {
        patterns: [
          /web(?:サービス|アプリ).{0,16}(?:継続開発|改善|グロース)/i,
        ],
        excludedPatterns: COMMON_NEGATIONS,
        delta: 2,
        reason: "Web開発経験を継続して積める記載があります",
      },
    ],
    negative: [
      {
        patterns: [
          /(?:販売|営業|コールセンター).{0,12}(?:から開始|へ配属)/i,
          /職種変更.{0,12}(?:あり|可能性)/i,
        ],
        delta: -3,
        reason: "希望するキャリアから外れる配属の可能性があります",
      },
    ],
  },
  training: {
    positive: [
      {
        patterns: [
          /研修.{0,20}(?:\d+\s*(?:か月|ヶ月)|カリキュラム|専任講師|実践課題)/i,
          /(?:\d+\s*(?:か月|ヶ月)|約\s*\d+\s*年).{0,12}研修/i,
        ],
        excludedPatterns: [/研修.{0,12}(?:なし|ありません)/i],
        delta: 3,
        reason: "期間や内容が具体的な研修制度があります",
      },
      {
        patterns: [/未経験(?:者)?歓迎/i, /基礎から学べ/i, /OJT/i],
        excludedPatterns: [/未経験(?:者)?(?:不可|対象外)/i],
        delta: 1,
        reason: "未経験者や実務習得を支える教育記載があります",
      },
    ],
    negative: [
      {
        patterns: [
          /研修.{0,12}(?:なし|ありません)/i,
          /(?:独学|自主学習)(?:のみ|が中心)/i,
        ],
        delta: -3,
        reason: "研修・教育制度が十分でない可能性があります",
      },
    ],
  },
  growthEnvironment: {
    positive: [
      {
        patterns: [
          /\breact\b/i,
          /\btypescript\b/i,
        ],
        excludedPatterns: [
          /(?:react|typescript).{0,20}(?:使用しない|利用しない|禁止)/i,
        ],
        delta: 2,
        reason: "ReactまたはTypeScriptの明記があります",
      },
      {
        patterns: [/javascript/i, /モダン(?:な)?技術/i],
        excludedPatterns: [
          /javascript.{0,20}(?:使用しない|利用しない|禁止)/i,
        ],
        delta: 1,
        reason: "JavaScriptまたはモダンな技術環境の記載があります",
      },
      {
        patterns: [
          /メンター|勉強会|資格取得支援|技術書.{0,8}(?:購入|補助)/i,
          /新技術.{0,12}(?:挑戦|導入)/i,
        ],
        delta: 2,
        reason: "継続的な学習を支援する制度があります",
      },
    ],
    negative: [
      {
        patterns: [
          /レガシー.{0,12}(?:のみ|が中心)/i,
          /技術選定.{0,12}(?:不可|できない)/i,
        ],
        delta: -2,
        reason: "新しい技術経験を得にくい可能性があります",
      },
    ],
  },
  webDevelopment: {
    positive: [
      {
        patterns: [
          /web(?:サービス|アプリ(?:ケーション)?).{0,16}(?:開発|運営|改善)/i,
          /自社(?:web)?サービス/i,
          /saas.{0,12}(?:開発|運営)/i,
        ],
        excludedPatterns: COMMON_NEGATIONS,
        delta: 3,
        reason: "Webサービス・Webアプリ開発の記載があります",
      },
    ],
    negative: [
      {
        patterns: [
          /(?:監視|運用保守|テクニカルサポート|営業|販売)(?:業務)?(?:のみ|が中心|を主に担当)/i,
          /(?:営業|販売)(?:職|業務).{0,12}(?:からスタート|へ配属)/i,
        ],
        delta: -4,
        reason: "Web開発以外の業務が中心となる可能性があります",
      },
    ],
  },
  aiFit: {
    positive: [
      {
        patterns: [
          /(?:生成ai|chatgpt|copilot).{0,16}(?:活用|利用|導入|推奨)/i,
          /ai.{0,12}(?:開発|業務改善|活用)/i,
        ],
        excludedPatterns: [
          /(?:生成ai|chatgpt|copilot|ai).{0,16}(?:禁止|使用不可|利用しない)/i,
        ],
        delta: 3,
        reason: "AIを開発や業務改善へ活用する記載があります",
      },
    ],
    negative: [
      {
        patterns: [
          /(?:生成ai|chatgpt|copilot|ai).{0,16}(?:禁止|使用不可|利用しない)/i,
        ],
        delta: -3,
        reason: "AIツールの利用制限を示す記載があります",
      },
    ],
  },
  gitTeamDevelopment: {
    positive: [
      {
        patterns: [
          /git(?:hub)?を(?:使用|利用)/i,
          /コードレビュー/i,
          /チーム開発/i,
          /プルリクエスト/i,
        ],
        excludedPatterns: [
          /(?:git|コードレビュー|チーム開発).{0,16}(?:なし|ありません|行いません)/i,
        ],
        delta: 2,
        reason: "Gitやレビューを使うチーム開発の記載があります",
      },
    ],
    negative: [
      {
        patterns: [
          /(?:git|コードレビュー|チーム開発).{0,16}(?:なし|ありません|行いません)/i,
        ],
        delta: -2,
        reason: "チーム開発経験につながりにくい記載があります",
      },
    ],
  },
  assignmentFlexibility: {
    positive: [
      {
        patterns: [
          /(?:希望|適性).{0,12}(?:配属|案件).{0,12}(?:考慮|相談)/i,
          /配属.{0,12}(?:希望を確認|選択可能)/i,
        ],
        excludedPatterns: [
          /(?:希望|配属).{0,16}(?:考慮しない|選べない|会社が決定)/i,
        ],
        delta: 3,
        reason: "配属や案件の希望を考慮する記載があります",
      },
    ],
    negative: [
      {
        patterns: [
          /配属先.{0,12}(?:選べない|会社が決定|指定します)/i,
          /(?:販売|営業|コールセンター).{0,12}(?:から開始|へ配属)/i,
        ],
        delta: -3,
        reason: "希望外の配属となる可能性があります",
      },
    ],
  },
  workLifeBalance: {
    positive: [
      {
        patterns: [/年間休日\s*12\d\s*日/i, /完全週休[二2]日/i],
        delta: 2,
        reason: "年間休日または完全週休2日の記載があります",
      },
      {
        patterns: [
          /残業.{0,10}(?:月平均)?\s*(?:[0-9]|1\d|20)\s*時間(?:以下|程度)?/i,
          /(?:リモート|在宅勤務|テレワーク).{0,12}(?:可|可能|あり|導入)/i,
        ],
        excludedPatterns: [
          /(?:リモート|在宅勤務|テレワーク).{0,12}(?:なし|ありません|不可)/i,
        ],
        delta: 1,
        reason: "残業または働く場所に配慮した記載があります",
      },
    ],
    negative: [
      {
        patterns: [
          /残業.{0,10}(?:月平均)?\s*(?:[4-9]\d|[1-9]\d{2,})\s*時間/i,
          /休日出勤.{0,8}(?:あり|があります)/i,
          /夜勤.{0,8}(?:あり|含む)/i,
        ],
        delta: -3,
        reason: "勤務時間や休日について確認が必要です",
      },
    ],
  },
  compensation: {
    positive: [
      {
        patterns: [
          /月給\s*\d{2,3}(?:万|万円)/i,
          /年収\s*\d{3,4}(?:万|万円)/i,
        ],
        delta: 2,
        reason: "月給または年収が具体的に記載されています",
      },
      {
        patterns: [
          /賞与.{0,10}(?:年\s*\d回|あり|支給)/i,
          /昇給.{0,8}(?:あり|年)/i,
          /交通費.{0,8}(?:支給|全額)/i,
        ],
        excludedPatterns: [/(?:賞与|昇給).{0,8}(?:なし|ありません)/i],
        delta: 1,
        reason: "賞与・昇給など待遇面の記載があります",
      },
    ],
    negative: [
      {
        patterns: [
          /固定残業代.{0,20}(?:[4-9]\d|[1-9]\d{2,})\s*時間/i,
          /試用期間.{0,20}(?:減額|給与変更|時給)/i,
        ],
        delta: -2,
        reason: "固定残業代や試用期間中の待遇に確認が必要です",
      },
    ],
  },
};

function normalizeText(text: string): string {
  return text.normalize("NFKC").replace(/\r\n?/g, "\n").trim();
}

function splitIntoSentences(text: string): string[] {
  return normalizeText(text)
    .split(/(?<=[。！？!?])|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function matchesRule(sentence: string, rule: TextRule): boolean {
  const matches = rule.patterns.some((pattern) => pattern.test(sentence));
  const excluded = rule.excludedPatterns?.some((pattern) =>
    pattern.test(sentence),
  );
  return matches && !excluded;
}

function summarizeEvidence(sentence: string): string {
  const compact = sentence.replace(/\s+/g, " ").trim();
  return compact.length > 64 ? `${compact.slice(0, 61)}...` : compact;
}

function evaluateItem(
  sentences: readonly string[],
  ruleSet: ItemRuleSet,
): EvaluationScoreDetail {
  let score = 5;
  const reasons: EvaluationReason[] = [];

  for (const rule of [...ruleSet.positive, ...ruleSet.negative]) {
    const matchedSentence = sentences.find((sentence) =>
      matchesRule(sentence, rule),
    );
    if (matchedSentence) {
      score += rule.delta;
      reasons.push({
        type: rule.delta > 0 ? "positive" : "negative",
        label: rule.reason,
        delta: rule.delta,
        evidence: summarizeEvidence(matchedSentence),
      });
    }
  }

  const safeScore = Math.min(10, Math.max(0, Math.round(score)));
  return {
    score: safeScore,
    autoScore: safeScore,
    reasons:
      reasons.slice(0, 3).length > 0
        ? reasons.slice(0, 3)
        : [
            {
              type: "neutral",
              label: "判断できる情報が不足しているため基準点です",
              delta: 0,
            },
          ],
    manuallyAdjusted: false,
  };
}

function includesAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export type PrimaryRole =
  | "web_frontend"
  | "web_adjacent"
  | "cloud"
  | "infrastructure"
  | "operations"
  | "help_desk"
  | "sales"
  | "unknown";

export interface PrimaryRoleClassification {
  role: PrimaryRole;
  label: string;
  evidence: string[];
}

function findMatchingEvidence(
  text: string,
  patterns: readonly RegExp[],
): string[] {
  return [
    ...new Set(
      splitIntoSentences(text)
        .filter((sentence) =>
          patterns.some((pattern) => pattern.test(sentence)),
        )
        .map(summarizeEvidence),
    ),
  ].slice(0, 3);
}

export function classifyPrimaryRole(
  text: string,
  jobTitle: string,
): PrimaryRoleClassification {
  const normalizedText = normalizeText(text);
  const normalizedTitle = normalizeText(jobTitle);
  const titleMatches = (patterns: readonly RegExp[]) =>
    includesAny(normalizedTitle, patterns);
  const titleEvidence = normalizedTitle
    ? [`求人職種名「${summarizeEvidence(normalizedTitle)}」`]
    : [];

  const cloudPatterns = [
    /クラウドエンジニア(?:として|が中心|を募集)/i,
    /(?:aws|azure|gcp|クラウド).{0,18}(?:基盤|インフラ).{0,12}(?:構築|運用).{0,12}(?:中心|主に|担当)/i,
  ];
  const cloudEvidence = findMatchingEvidence(normalizedText, cloudPatterns);

  if (
    titleMatches([/クラウドエンジニア/i]) ||
    cloudEvidence.length > 0
  ) {
    return {
      role: "cloud",
      label: "クラウド",
      evidence: [
        ...(titleMatches([/クラウドエンジニア/i])
          ? titleEvidence
          : []),
        ...cloudEvidence,
      ].slice(0, 3),
    };
  }
  const infrastructurePatterns = [
    /(?:インフラ|サーバー|ネットワーク).{0,16}(?:構築|運用|保守|監視).{0,12}(?:中心|主に|担当)/i,
  ];
  const infrastructureEvidence = findMatchingEvidence(
    normalizedText,
    infrastructurePatterns,
  );
  if (
    titleMatches([/インフラエンジニア|サーバーエンジニア|ネットワークエンジニア/i]) ||
    infrastructureEvidence.length > 0
  ) {
    return {
      role: "infrastructure",
      label: "インフラ・サーバー・ネットワーク",
      evidence: [
        ...(titleMatches([
          /インフラエンジニア|サーバーエンジニア|ネットワークエンジニア/i,
        ])
          ? titleEvidence
          : []),
        ...infrastructureEvidence,
      ].slice(0, 3),
    };
  }
  const operationsPatterns = [
    /(?:運用監視|システム監視|サーバー監視).{0,12}(?:中心|主に|担当)/i,
    /24\s*時間\s*365\s*日.{0,12}(?:監視|運用)/i,
  ];
  const operationsEvidence = findMatchingEvidence(
    normalizedText,
    operationsPatterns,
  );
  if (
    titleMatches([/運用監視|監視オペレーター/i]) ||
    operationsEvidence.length > 0
  ) {
    return {
      role: "operations",
      label: "運用監視",
      evidence: [
        ...(titleMatches([/運用監視|監視オペレーター/i])
          ? titleEvidence
          : []),
        ...operationsEvidence,
      ].slice(0, 3),
    };
  }
  const helpDeskPatterns = [
    /(?:ヘルプデスク|テクニカルサポート).{0,12}(?:中心|主に|担当)/i,
  ];
  const helpDeskEvidence = findMatchingEvidence(
    normalizedText,
    helpDeskPatterns,
  );
  if (
    titleMatches([/ヘルプデスク|テクニカルサポート/i]) ||
    helpDeskEvidence.length > 0
  ) {
    return {
      role: "help_desk",
      label: "ヘルプデスク・サポート",
      evidence: [
        ...(titleMatches([/ヘルプデスク|テクニカルサポート/i])
          ? titleEvidence
          : []),
        ...helpDeskEvidence,
      ].slice(0, 3),
    };
  }
  const salesPatterns = [
    /(?:営業|販売)(?:職|業務).{0,16}(?:中心|主に担当|を担当|からスタート|へ配属)/i,
    /入社後.{0,20}(?:営業|販売).{0,16}(?:からスタート|を担当)/i,
    /(?:家電量販店|携帯ショップ|販売店舗).{0,20}(?:プロジェクト|配属|勤務)/i,
  ];
  const salesEvidence = findMatchingEvidence(
    normalizedText,
    salesPatterns,
  );
  if (
    titleMatches([/営業職|法人営業|個人営業/i]) ||
    salesEvidence.length > 0
  ) {
    return {
      role: "sales",
      label: "営業・販売",
      evidence: [
        ...(titleMatches([/営業職|法人営業|個人営業/i])
          ? titleEvidence
          : []),
        ...salesEvidence,
      ].slice(0, 3),
    };
  }
  const webFrontendPatterns = [
    /フロントエンド(?:開発|実装).{0,12}(?:中心|主に|担当)/i,
    /(?:webサービス|webアプリ).{0,16}(?:開発|改善).{0,12}(?:中心|主に|担当)/i,
  ];
  const webFrontendEvidence = findMatchingEvidence(
    normalizedText,
    webFrontendPatterns,
  );
  if (
    titleMatches([
      /フロントエンド|webエンジニア|webデザイナー|web制作/i,
    ]) ||
    webFrontendEvidence.length > 0
  ) {
    return {
      role: "web_frontend",
      label: "Web・フロントエンド開発",
      evidence: [
        ...(titleMatches([
          /フロントエンド|webエンジニア|webデザイナー|web制作/i,
        ])
          ? titleEvidence
          : []),
        ...webFrontendEvidence,
      ].slice(0, 3),
    };
  }
  const webAdjacentPatterns = [
    /(?:バックエンド|サーバーサイド|api).{0,16}(?:開発|実装).{0,12}(?:中心|主に|担当)/i,
  ];
  const webAdjacentEvidence = findMatchingEvidence(
    normalizedText,
    webAdjacentPatterns,
  );
  if (
    titleMatches([/バックエンド|サーバーサイド/i]) ||
    webAdjacentEvidence.length > 0
  ) {
    return {
      role: "web_adjacent",
      label: "Web系バックエンド・周辺開発",
      evidence: [
        ...(titleMatches([/バックエンド|サーバーサイド/i])
          ? titleEvidence
          : []),
        ...webAdjacentEvidence,
      ].slice(0, 3),
    };
  }

  return {
    role: "unknown",
    label: "分類不明",
    evidence: [],
  };
}

function applyComparisonScore(
  detail: EvaluationScoreDetail,
  targetScore: number,
  type: EvaluationReason["type"],
  label: string,
  evidence: string,
): EvaluationScoreDetail {
  const safeTarget = Math.min(10, Math.max(0, Math.round(targetScore)));
  const delta = safeTarget - detail.score;
  const retainedReasons = detail.reasons.filter(
    (reason) => reason.type !== "neutral",
  );

  return {
    score: safeTarget,
    autoScore: safeTarget,
    manuallyAdjusted: false,
    reasons: [
      ...retainedReasons,
      {
        type,
        label,
        delta,
        evidence,
      },
    ].slice(-3),
  };
}

function applyProfileComparisons(
  details: EvaluationScoreDetails,
  text: string,
  context?: JobPostingEvaluationContext,
): EvaluationScoreDetails {
  const result = { ...details };
  const primaryRole = classifyPrimaryRole(
    text,
    context?.jobTitle ?? "",
  );
  const primaryRoleEvidence =
    primaryRole.evidence.join("。") ||
    "中心業務分類の根拠を抽出できませんでした";
  const careerProfile = normalizeText(
    [
      context?.desiredRole,
      context?.careerPriorities,
      context?.skillsAndTools,
      context?.workExperience,
      context?.portfolioExperience,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const desiresWeb = includesAny(careerProfile, [
    /フロントエンド/i,
    /web(?:制作|開発|アプリ|サービス|エンジニア)/i,
    /ウェブ(?:制作|開発|アプリ|サービス)/i,
  ]);

  if (!careerProfile) {
    result.careerFit = applyComparisonScore(
      result.careerFit,
      5,
      "neutral",
      "プロフィールとの比較材料が不足しています",
      "希望職種・重視すること・スキル・経験が未入力",
    );
    return result;
  }

  if (!desiresWeb) {
    result.careerFit = applyComparisonScore(
      result.careerFit,
      5,
      "neutral",
      "希望職種や経験からWeb開発志向を特定できません",
      "登録プロフィールの範囲から推定",
    );
    return result;
  }

  const profileEvidence =
    "希望職種・スキル・職務経験・制作経験からWeb開発志向と推定";

  if (primaryRole.role === "web_frontend") {
    result.jobFit = applyComparisonScore(
      result.jobFit,
      Math.max(8, result.jobFit.score),
      "positive",
      "希望するWeb・フロントエンド業務と一致します",
      `${primaryRoleEvidence}。${profileEvidence}`,
    );
    result.careerFit = applyComparisonScore(
      result.careerFit,
      Math.max(8, result.careerFit.score),
      "positive",
      "希望職種や経験から推定したキャリア方向と一致します",
      `${primaryRoleEvidence}。${profileEvidence}`,
    );
    return result;
  }

  if (primaryRole.role === "web_adjacent") {
    result.jobFit = applyComparisonScore(
      result.jobFit,
      Math.min(7, Math.max(5, result.jobFit.score)),
      "neutral",
      "Web系周辺職種ですがフロントエンド専任ではありません",
      `${primaryRoleEvidence}。${profileEvidence}`,
    );
    result.careerFit = applyComparisonScore(
      result.careerFit,
      Math.min(7, Math.max(5, result.careerFit.score)),
      "neutral",
      "Web系キャリアには関連しますが希望職種とは一部異なります",
      `${primaryRoleEvidence}。${profileEvidence}`,
    );
    return result;
  }

  const mismatchCaps: Partial<Record<PrimaryRole, number>> = {
    cloud: 3,
    infrastructure: 3,
    operations: 2,
    help_desk: 2,
    sales: 1,
  };
  const mismatchCap = mismatchCaps[primaryRole.role];
  if (mismatchCap !== undefined) {
    result.jobFit = applyComparisonScore(
      result.jobFit,
      Math.min(mismatchCap, result.jobFit.score),
      "negative",
      "求人の中心業務が希望するWeb・フロントエンド職と異なります",
      `${primaryRoleEvidence}。${profileEvidence}`,
    );
    result.careerFit = applyComparisonScore(
      result.careerFit,
      Math.min(4, result.careerFit.score),
      "negative",
      "希望職種や経験から推定したキャリア方向と異なります",
      `${primaryRoleEvidence}。${profileEvidence}`,
    );
    return result;
  }

  result.jobFit = applyComparisonScore(
    result.jobFit,
    5,
    "neutral",
    "求人の中心業務を特定できず一致度の根拠が不足しています",
    primaryRoleEvidence,
  );
  result.careerFit = applyComparisonScore(
    result.careerFit,
    5,
    "neutral",
    "希望職種や経験との比較に必要な求人情報が不足しています",
    `${primaryRoleEvidence}。${profileEvidence}`,
  );
  return result;
}

export function detectScreeningWarnings(
  text: string,
  context?: JobPostingEvaluationContext,
): ScreeningWarning[] {
  const normalized = normalizeText(text);
  const warnings: ScreeningWarning[] = [];
  const primaryRole = classifyPrimaryRole(
    text,
    context?.jobTitle ?? "",
  );
  const cloudCentered =
    primaryRole.role === "cloud" &&
    !includesAny(normalized, [/クラウド.{0,12}(?:中心ではない|担当しない)/i]);
  const infrastructureCentered =
    (primaryRole.role === "infrastructure" ||
      primaryRole.role === "operations") &&
    !includesAny(normalized, [
      /(?:インフラ|監視|運用).{0,12}(?:なし|担当しない)/i,
    ]);
  const nightShift =
    includesAny(normalized, [
      /夜勤.{0,10}(?:あり|含む|可能性)/i,
      /夜間(?:勤務|シフト)/i,
      /(?:交替|交代)勤務/i,
    ]) &&
    !includesAny(normalized, [
      /夜勤.{0,8}(?:なし|ありません)/i,
      /夜間勤務.{0,8}(?:なし|ありません)/i,
    ]);

  if (cloudCentered) {
    warnings.push({
      condition: "cloud_centered",
      label: "クラウドエンジニア中心",
      reason:
        "クラウド基盤・インフラ業務が中心と読み取れるため、希望するWeb開発との一致を確認してください。",
      judgmentCap: "orange",
    });
  }
  if (infrastructureCentered) {
    warnings.push({
      condition: "infrastructure_operations",
      label: "インフラ運用・監視中心",
      reason:
        "インフラの運用・保守・監視が中心と読み取れるため、開発経験につながるか確認してください。",
      judgmentCap: "orange",
    });
  }
  if (nightShift) {
    warnings.push({
      condition: "night_shift",
      label: "夜勤あり",
      reason:
        "夜勤または交替勤務の記載があるため、希望する働き方と合うか確認してください。",
      judgmentCap: "orange",
    });
  }

  const desiredRole = normalizeText(context?.desiredRole ?? "");
  const desiresWebDevelopment = includesAny(desiredRole, [
    /フロントエンド/i,
    /web(?:エンジニア|開発)/i,
    /ウェブ(?:エンジニア|開発)/i,
  ]);
  const clearlyDifferentRole =
    cloudCentered ||
    infrastructureCentered ||
    primaryRole.role === "help_desk" ||
    primaryRole.role === "sales";
  if (desiresWebDevelopment && clearlyDifferentRole) {
    warnings.push({
      condition: "desired_role_mismatch",
      label: "希望職種と大きく異なる",
      reason:
        "応募者プロフィールの希望職種と、求人票で中心となる業務が大きく異なります。",
      judgmentCap: "red",
    });
  }

  const profileEvidence = normalizeText(
    `${context?.skillsAndTools ?? ""}\n${context?.workExperience ?? ""}`,
  );
  const requiresLongExperience = includesAny(normalized, [
    /実務経験.{0,12}(?:[3-9]|[1-9]\d)\s*年以上.{0,8}(?:必須|求む)/i,
    /(?:必須|応募条件).{0,20}実務経験.{0,8}(?:[3-9]|[1-9]\d)\s*年以上/i,
  ]);
  const profileShowsExperience = includesAny(profileEvidence, [
    /実務経験/i,
    /(?:[3-9]|[1-9]\d)\s*年以上/i,
    /業務で.{0,12}(?:使用|開発|担当)/i,
  ]);
  const requiredTechnologyNames = [
    "react",
    "typescript",
    "javascript",
    "java",
    "php",
    "python",
    "aws",
    "azure",
    "gcp",
  ].filter((technology) =>
    includesAny(normalized, [
      new RegExp(
        `(?:必須|応募条件).{0,30}${technology}|${technology}.{0,20}(?:必須|実務経験)`,
        "i",
      ),
    ]),
  );
  const hasRequiredTechnology =
    requiredTechnologyNames.length > 0 &&
    requiredTechnologyNames.some((technology) =>
      profileEvidence.toLowerCase().includes(technology),
    );
  const hasExperienceGap =
    Boolean(profileEvidence) &&
    ((requiresLongExperience && !profileShowsExperience) ||
      (requiredTechnologyNames.length >= 2 && !hasRequiredTechnology));

  if (hasExperienceGap) {
    warnings.push({
      condition: "required_experience_gap",
      label: "必須経験が現在のスキルとかけ離れている",
      reason:
        "求人票の必須経験・必須技術に対し、プロフィールから対応する経験を十分に確認できません。",
      judgmentCap: "orange",
    });
  }

  return warnings;
}

export function hasSufficientJobPostingText(text: string): boolean {
  const meaningfulLength = normalizeText(text).replace(/\s/g, "").length;
  return meaningfulLength >= MIN_JOB_POSTING_LENGTH;
}

function createNeutralScores(): DecisionCompanyScores {
  return {
    jobFit: 5,
    careerFit: 5,
    training: 5,
    growthEnvironment: 5,
    webDevelopment: 5,
    aiFit: 5,
    gitTeamDevelopment: 5,
    assignmentFlexibility: 5,
    workLifeBalance: 5,
    compensation: 5,
  };
}

export function createJobPostingEvaluationContext(
  profile: ApplicantProfile,
  jobTitle = "",
): JobPostingEvaluationContext {
  return {
    jobTitle,
    desiredRole: profile.desiredRole,
    careerPriorities: profile.careerPriorities,
    skillsAndTools: profile.skillsAndTools,
    workExperience: profile.workExperience,
    portfolioExperience: profile.portfolioExperience,
  };
}

export const ruleBasedJobPostingEvaluator: JobPostingEvaluator = {
  evaluate(
    text: string,
    context?: JobPostingEvaluationContext,
  ): DraftEvaluation {
    const sentences = splitIntoSentences(text);
    const scores = createNeutralScores();
    const baseDetails = {} as EvaluationScoreDetails;

    for (const key of Object.keys(RULES) as Array<
      keyof DecisionCompanyScores
    >) {
      const result = evaluateItem(sentences, RULES[key]);
      scores[key] = result.score;
      baseDetails[key] = result;
    }

    const scoreDetails = applyProfileComparisons(
      baseDetails,
      text,
      context,
    );
    for (const key of Object.keys(scoreDetails) as Array<
      keyof DecisionCompanyScores
    >) {
      scores[key] = scoreDetails[key].score;
    }

    return {
      scores,
      scoreDetails,
      screeningWarnings: detectScreeningWarnings(text, context),
    };
  },
};
