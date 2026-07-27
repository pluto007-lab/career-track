import type { ApplicantProfile } from "./applicantProfile";

export interface CompanyMotivationNotes {
  appealPoints: string;
  focusPoints: string;
  avoidPoints: string;
  applicationReason: string;
}

export type MotivationTone =
  | "standard"
  | "concise"
  | "enthusiastic"
  | "calm";

export type MotivationPurpose =
  | "resume"
  | "application_form"
  | "interview_preparation";

export type MotivationLengthPreset = 150 | 200 | 300 | 400 | "custom";

export interface MotivationGenerationInput {
  companyName: string;
  jobTitle: string;
  jobPostingText: string;
  applicantProfile: ApplicantProfile;
  companyMotivationNotes: CompanyMotivationNotes;
  targetLength: number;
  tone: MotivationTone;
  purpose: MotivationPurpose;
}

export type MotivationMissingInformation =
  | "job_posting"
  | "applicant_profile"
  | "company_motivation_notes";
