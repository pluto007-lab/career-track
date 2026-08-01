import type { ApplicantProfile } from "./applicantProfile";
import type { CareerTrackSettings, Company } from "./company";
import type { CompanyListPreferences } from "./companyList";

export interface CareerTrackDataSnapshot {
  companies: Company[];
  applicantProfile: ApplicantProfile;
  settings: CareerTrackSettings;
  companyListPreferences: CompanyListPreferences;
}

export interface CareerTrackBackupV1 {
  format: "career-track-backup";
  version: 1;
  exportedAt: string;
  data: CareerTrackDataSnapshot;
}

export type BackupParseResult =
  | { ok: true; value: CareerTrackBackupV1 }
  | { ok: false; message: string };

export type BackupOperationResult =
  | { ok: true }
  | { ok: false; message: string };
