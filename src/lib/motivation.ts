import type { ApplicantProfile } from "../types/applicantProfile";
import type { Company } from "../types/company";
import type {
  CompanyMotivationNotes,
  MotivationGenerationInput,
  MotivationMissingInformation,
  MotivationPurpose,
  MotivationTone,
} from "../types/motivation";

interface CreateMotivationInputOptions {
  company: Company;
  applicantProfile: ApplicantProfile;
  targetLength: number;
  tone: MotivationTone;
  purpose: MotivationPurpose;
}

export type CompanyMotivationFields = Pick<
  Company,
  | "motivationAppeal"
  | "motivationFocus"
  | "motivationAvoid"
  | "applicationNotes"
>;

export const MOTIVATION_MISSING_LABELS: Record<
  MotivationMissingInformation,
  string
> = {
  job_posting: "求人票が未入力です。",
  applicant_profile: "応募者プロフィールが未入力です。",
  company_motivation_notes:
    "企業の魅力・応募理由メモが未入力です。",
};

export function createCompanyMotivationNotes(
  company: Company,
): CompanyMotivationNotes {
  return {
    appealPoints: company.motivationAppeal,
    focusPoints: company.motivationFocus,
    avoidPoints: company.motivationAvoid,
    applicationReason: company.applicationNotes,
  };
}

export function updateCompanyMotivationFields(
  company: Company,
  fields: CompanyMotivationFields,
): Company {
  return {
    ...company,
    motivationAppeal: fields.motivationAppeal.trim(),
    motivationFocus: fields.motivationFocus.trim(),
    motivationAvoid: fields.motivationAvoid.trim(),
    applicationNotes: fields.applicationNotes.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeTargetLength(targetLength: number): number {
  if (!Number.isFinite(targetLength) || targetLength <= 0) {
    return 200;
  }

  return Math.min(2000, Math.max(1, Math.round(targetLength)));
}

export function createMotivationGenerationInput({
  company,
  applicantProfile,
  targetLength,
  tone,
  purpose,
}: CreateMotivationInputOptions): MotivationGenerationInput {
  return {
    companyName: company.name,
    jobTitle: company.jobTitle,
    jobPostingText: company.jobPostingText,
    applicantProfile,
    companyMotivationNotes: createCompanyMotivationNotes(company),
    targetLength: normalizeTargetLength(targetLength),
    tone,
    purpose,
  };
}

export function getMotivationMissingInformation(
  input: MotivationGenerationInput,
): MotivationMissingInformation[] {
  const missing: MotivationMissingInformation[] = [];

  if (!input.jobPostingText.trim()) {
    missing.push("job_posting");
  }

  const hasProfileInformation = Object.values(
    input.applicantProfile,
  ).some((value) => value.trim());
  if (!hasProfileInformation) {
    missing.push("applicant_profile");
  }

  const notes = input.companyMotivationNotes;
  if (
    !notes.appealPoints.trim() &&
    !notes.focusPoints.trim() &&
    !notes.applicationReason.trim()
  ) {
    missing.push("company_motivation_notes");
  }

  return missing;
}
