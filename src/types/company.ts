export type Judgment = "green" | "yellow" | "orange" | "red";

export type JudgmentSelection =
  | { mode: "auto" }
  | { mode: "manual"; judgment: Judgment };

export type EvaluationStatus = "unrated" | "rated";

export type ApplicationStatus =
  | "not_applied"
  | "preparing"
  | "applied"
  | "document_screening"
  | "document_passed"
  | "first_interview_scheduled"
  | "first_interview_completed"
  | "second_interview_scheduled"
  | "second_interview_completed"
  | "final_interview_scheduled"
  | "final_interview_completed"
  | "casual_interview_scheduled"
  | "waiting_for_reply"
  | "scheduling"
  | "waiting_for_result"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "on_hold"
  | "closed";

export const CHOICE_VALUES = ["yes", "no", "partial", "unknown"] as const;

export type ChoiceValue = (typeof CHOICE_VALUES)[number];
export type ManualPriority = "highest" | "high" | "medium" | "low" | "skip";

export const KNOWN_APPLICATION_SOURCES = [
  "company_website",
  "indeed",
  "wantedly",
  "green",
  "en_tenshoku",
  "mynavi",
  "rikunabi",
  "hellowork",
  "referral",
] as const;

export type KnownApplicationSource =
  (typeof KNOWN_APPLICATION_SOURCES)[number];

export type ApplicationSource =
  | KnownApplicationSource
  | (string & Record<never, never>);

export interface CompanyScores {
  frontend: number;
  javascriptReactTypeScript: number;
  training: number;
  assignmentFlexibility: number;
  gitTeamDevelopment: number;
  webService: number;
  workLifeBalance: number;
  compensation: number;
  aiFit: number;
}

export interface DecisionCompanyScores {
  jobFit: number;
  careerFit: number;
  training: number;
  growthEnvironment: number;
  webDevelopment: number;
  aiFit: number;
  gitTeamDevelopment: number;
  assignmentFlexibility: number;
  workLifeBalance: number;
  compensation: number;
}

export type EvaluationReasonType = "positive" | "negative" | "neutral";

export interface EvaluationReason {
  type: EvaluationReasonType;
  label: string;
  delta: number;
  evidence?: string;
}

export interface EvaluationScoreDetail {
  score: number;
  autoScore?: number;
  reasons: EvaluationReason[];
  manuallyAdjusted?: boolean;
}

export interface DecisionEvaluation {
  status: EvaluationStatus;
  overallReview: string;
  scores: DecisionCompanyScores;
  scoreDetails?: Partial<
    Record<keyof DecisionCompanyScores, EvaluationScoreDetail>
  >;
  autoScore: number;
  autoJudgment: Judgment;
  judgmentSelection: JudgmentSelection;
}

export type InterviewStage =
  | "casual"
  | "document"
  | "first"
  | "second"
  | "final"
  | "conditions"
  | "other";

export type InterviewFormat = "online" | "in_person" | "phone" | "other";
export type QuestionImportance = "high" | "medium" | "low";
export type AnswerEvaluation = "good" | "neutral" | "concern";
export type InterviewQuestionCategory =
  | "training"
  | "assignment"
  | "technology"
  | "development_project"
  | "client_site_work"
  | "employment_type"
  | "compensation"
  | "work_style"
  | "remote_work"
  | "career"
  | "other";

export interface InterviewQuestion {
  id: string;
  question: string;
  category: InterviewQuestionCategory;
  importance: QuestionImportance;
  answer: string;
  isConfirmed: boolean;
  evaluation?: AnswerEvaluation;
}

export interface Interview {
  id: string;
  stage: InterviewStage;
  scheduledAt?: string;
  format: InterviewFormat;
  locationOrUrl: string;
  interviewer: string;
  preparationNotes: string;
  reflection: string;
  nextStep: string;
}

export interface DeadlineValue {
  date: string;
  time?: string;
}

export interface ApplicationManagement {
  nextEventAt?: string;
  documentDeadline?: DeadlineValue;
  responseDeadline?: DeadlineValue;
  notes: string;
}

export interface Company {
  id: string;
  archived: boolean;
  name: string;
  jobTitle: string;
  jobUrl: string;
  jobPostingText: string;
  source: ApplicationSource;
  employmentType: string;
  location: string;
  applicationStatus: ApplicationStatus;
  appliedAt?: string;
  documentDeadline?: string;
  nextAction?: string;
  nextActionDate?: string;
  applicationManagement: ApplicationManagement;
  contactName: string;
  applicationNotes: string;
  salaryMin?: number;
  salaryMax?: number;
  annualIncomeMin?: number;
  annualIncomeMax?: number;
  bonus: string;
  annualHolidays?: number;
  overtimeHours?: number;
  remoteWork: ChoiceValue;
  relocation: ChoiceValue;
  sideJob: ChoiceValue;
  probationPeriod: string;
  fixedOvertimePay: string;
  trainingPeriod: string;
  trainingDuringWorkHours: ChoiceValue;
  otherWorkDuringTraining: ChoiceValue;
  assignmentFlexibility: ChoiceValue;
  nonDevelopmentAssignment: ChoiceValue;
  clientSiteWork: ChoiceValue;
  inHouseDevelopment: ChoiceValue;
  benchSalary: ChoiceValue;
  beginnerAssignmentExamples: string;
  technologies: string[];
  technologyNotes: string;
  codeReview: ChoiceValue;
  teamDevelopment: ChoiceValue;
  aiUsage: ChoiceValue;
  websiteDevelopment: ChoiceValue;
  webAppDevelopment: ChoiceValue;
  strengths: string;
  concerns: string;
  interviewConfirmationPoints: string;
  redFlags: string;
  notes: string;
  motivationAppeal: string;
  motivationFocus: string;
  motivationAvoid: string;
  motivationStatement: string;
  companySelfPromotion: string;
  scores: CompanyScores;
  evaluationStatus: EvaluationStatus;
  autoScore: number;
  autoJudgment: Judgment;
  judgmentSelection: JudgmentSelection;
  decisionEvaluation: DecisionEvaluation;
  manualPriority: ManualPriority;
  interviewQuestions: InterviewQuestion[];
  interviews: Interview[];
  createdAt: string;
  updatedAt: string;
}

export interface CareerTrackSettings {
  appName: string;
  sidebarCollapsed: boolean;
}

export interface CompanyFormValues {
  name: string;
  jobTitle: string;
  jobUrl: string;
  jobPostingText: string;
  source: ApplicationSource;
  employmentType: string;
  location: string;
  applicationStatus: ApplicationStatus;
  appliedAt: string;
  nextAction: string;
  nextEventAt: string;
  documentDeadlineDate: string;
  documentDeadlineTime: string;
  responseDeadlineDate: string;
  responseDeadlineTime: string;
  applicationManagementNotes: string;
  strengths: string;
  concerns: string;
  notes: string;
  motivationStatement: string;
  companySelfPromotion: string;
}
