import type { Company, CompanyFormValues } from "../types/company";
import {
  jstLocalDateTimeToUtcIso,
  utcIsoToJstLocalDateTime,
} from "./applicationManagement";

export const EMPTY_COMPANY_FORM_VALUES: CompanyFormValues = {
  name: "",
  jobTitle: "",
  jobUrl: "",
  jobPostingText: "",
  source: "",
  employmentType: "",
  location: "",
  applicationStatus: "not_applied",
  appliedAt: "",
  nextAction: "",
  nextEventAt: "",
  documentDeadlineDate: "",
  documentDeadlineTime: "",
  responseDeadlineDate: "",
  responseDeadlineTime: "",
  applicationManagementNotes: "",
  strengths: "",
  concerns: "",
  notes: "",
  motivationStatement: "",
  companySelfPromotion: "",
};

export function createCompany(values: CompanyFormValues): Company {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    archived: false,
    name: values.name.trim(),
    jobTitle: values.jobTitle.trim(),
    jobUrl: values.jobUrl.trim(),
    jobPostingText: values.jobPostingText.trim(),
    source: values.source.trim(),
    employmentType: values.employmentType,
    location: values.location.trim(),
    applicationStatus: values.applicationStatus,
    appliedAt: values.appliedAt || undefined,
    documentDeadline: undefined,
    nextAction: values.nextAction.trim() || undefined,
    nextActionDate: undefined,
    applicationManagement: {
      nextEventAt: jstLocalDateTimeToUtcIso(values.nextEventAt),
      documentDeadline: values.documentDeadlineDate
        ? {
            date: values.documentDeadlineDate,
            time: values.documentDeadlineTime || undefined,
          }
        : undefined,
      responseDeadline: values.responseDeadlineDate
        ? {
            date: values.responseDeadlineDate,
            time: values.responseDeadlineTime || undefined,
          }
        : undefined,
      notes: values.applicationManagementNotes.trim(),
    },
    contactName: "",
    applicationNotes: "",
    salaryMin: undefined,
    salaryMax: undefined,
    annualIncomeMin: undefined,
    annualIncomeMax: undefined,
    bonus: "",
    annualHolidays: undefined,
    overtimeHours: undefined,
    remoteWork: "unknown",
    relocation: "unknown",
    sideJob: "unknown",
    probationPeriod: "",
    fixedOvertimePay: "",
    trainingPeriod: "",
    trainingDuringWorkHours: "unknown",
    otherWorkDuringTraining: "unknown",
    assignmentFlexibility: "unknown",
    nonDevelopmentAssignment: "unknown",
    clientSiteWork: "unknown",
    inHouseDevelopment: "unknown",
    benchSalary: "unknown",
    beginnerAssignmentExamples: "",
    technologies: [],
    technologyNotes: "",
    codeReview: "unknown",
    teamDevelopment: "unknown",
    aiUsage: "unknown",
    websiteDevelopment: "unknown",
    webAppDevelopment: "unknown",
    strengths: values.strengths.trim(),
    concerns: values.concerns.trim(),
    interviewConfirmationPoints: "",
    redFlags: "",
    notes: values.notes.trim(),
    motivationAppeal: "",
    motivationFocus: "",
    motivationAvoid: "",
    motivationStatement: values.motivationStatement.trim(),
    companySelfPromotion: values.companySelfPromotion.trim(),
    scores: {
      frontend: 0,
      javascriptReactTypeScript: 0,
      training: 0,
      assignmentFlexibility: 0,
      gitTeamDevelopment: 0,
      webService: 0,
      workLifeBalance: 0,
      compensation: 0,
      aiFit: 0,
    },
    evaluationStatus: "unrated",
    autoScore: 0,
    autoJudgment: "red",
    judgmentSelection: { mode: "auto" },
    decisionEvaluation: {
      status: "unrated",
      overallReview: "",
      scores: {
        jobFit: 0,
        careerFit: 0,
        training: 0,
        growthEnvironment: 0,
        webDevelopment: 0,
        aiFit: 0,
        gitTeamDevelopment: 0,
        assignmentFlexibility: 0,
        workLifeBalance: 0,
        compensation: 0,
      },
      autoScore: 0,
      autoJudgment: "red",
      judgmentSelection: { mode: "auto" },
    },
    manualPriority: "medium",
    interviewQuestions: [],
    interviews: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function companyToFormValues(company: Company): CompanyFormValues {
  return {
    name: company.name,
    jobTitle: company.jobTitle,
    jobUrl: company.jobUrl,
    jobPostingText: company.jobPostingText,
    source: company.source,
    employmentType: company.employmentType,
    location: company.location,
    applicationStatus: company.applicationStatus,
    appliedAt: company.appliedAt ?? "",
    nextAction: company.nextAction ?? "",
    nextEventAt: utcIsoToJstLocalDateTime(
      company.applicationManagement.nextEventAt,
    ),
    documentDeadlineDate:
      company.applicationManagement.documentDeadline?.date ?? "",
    documentDeadlineTime:
      company.applicationManagement.documentDeadline?.time ?? "",
    responseDeadlineDate:
      company.applicationManagement.responseDeadline?.date ?? "",
    responseDeadlineTime:
      company.applicationManagement.responseDeadline?.time ?? "",
    applicationManagementNotes: company.applicationManagement.notes,
    strengths: company.strengths,
    concerns: company.concerns,
    notes: company.notes,
    motivationStatement: company.motivationStatement,
    companySelfPromotion: company.companySelfPromotion,
  };
}

export function updateCompany(
  company: Company,
  values: CompanyFormValues,
): Company {
  return {
    ...company,
    name: values.name.trim(),
    jobTitle: values.jobTitle.trim(),
    jobUrl: values.jobUrl.trim(),
    jobPostingText: values.jobPostingText.trim(),
    source: values.source.trim(),
    employmentType: values.employmentType,
    location: values.location.trim(),
    applicationStatus: values.applicationStatus,
    appliedAt: values.appliedAt || undefined,
    nextAction: values.nextAction.trim() || undefined,
    applicationManagement: {
      nextEventAt: jstLocalDateTimeToUtcIso(values.nextEventAt),
      documentDeadline: values.documentDeadlineDate
        ? {
            date: values.documentDeadlineDate,
            time: values.documentDeadlineTime || undefined,
          }
        : undefined,
      responseDeadline: values.responseDeadlineDate
        ? {
            date: values.responseDeadlineDate,
            time: values.responseDeadlineTime || undefined,
          }
        : undefined,
      notes: values.applicationManagementNotes.trim(),
    },
    strengths: values.strengths.trim(),
    concerns: values.concerns.trim(),
    notes: values.notes.trim(),
    motivationStatement: values.motivationStatement.trim(),
    companySelfPromotion: values.companySelfPromotion.trim(),
    updatedAt: new Date().toISOString(),
  };
}
