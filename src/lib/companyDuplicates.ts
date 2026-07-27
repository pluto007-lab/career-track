import type { Company } from "../types/company";

export type DuplicateMatchReason =
  | "company_and_job"
  | "company_name"
  | "company_name_without_legal_form";

export interface DuplicateCompanyCandidate {
  company: Company;
  reason: DuplicateMatchReason;
}

function normalizeBase(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("ja-JP")
    .replace(/\s+/g, "");
}

function removeLegalForm(value: string): string {
  return value
    .replace(/^(株式会社|有限会社|合同会社|\(株\))/, "")
    .replace(/(株式会社|有限会社|合同会社|\(株\))$/, "");
}

export function findDuplicateCompanies(
  companies: Company[],
  name: string,
  jobTitle: string,
  excludedCompanyId?: string,
): DuplicateCompanyCandidate[] {
  const normalizedName = normalizeBase(name);
  const normalizedJobTitle = normalizeBase(jobTitle);
  const nameWithoutLegalForm = removeLegalForm(normalizedName);
  if (!normalizedName) {
    return [];
  }

  return companies.flatMap((company) => {
    if (company.id === excludedCompanyId) {
      return [];
    }

    const candidateName = normalizeBase(company.name);
    const sameName = candidateName === normalizedName;
    const sameWithoutLegalForm =
      removeLegalForm(candidateName) === nameWithoutLegalForm;
    if (!sameName && !sameWithoutLegalForm) {
      return [];
    }

    const sameJob =
      normalizedJobTitle.length > 0 &&
      normalizeBase(company.jobTitle) === normalizedJobTitle;
    const reason: DuplicateMatchReason = sameJob
      ? "company_and_job"
      : sameName
        ? "company_name"
        : "company_name_without_legal_form";
    return [{ company, reason }];
  });
}
