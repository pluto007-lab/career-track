export interface ApplicantProfile {
  desiredRole: string;
  preferredWorkStyle: string;
  skillsAndTools: string;
  portfolioExperience: string;
  workExperience: string;
  qualifications: string;
  strengths: string;
  careerPriorities: string;
  expressionsToAvoid: string;
  additionalInformation: string;
}

export const APPLICANT_PROFILE_FIELDS: ReadonlyArray<{
  key: keyof ApplicantProfile;
  label: string;
}> = [
  { key: "desiredRole", label: "希望職種" },
  { key: "preferredWorkStyle", label: "希望する働き方" },
  { key: "skillsAndTools", label: "使用できる技術・ツール" },
  {
    key: "portfolioExperience",
    label: "制作経験・ポートフォリオ",
  },
  { key: "workExperience", label: "職務経験" },
  { key: "qualifications", label: "保有資格" },
  { key: "strengths", label: "強み" },
  {
    key: "careerPriorities",
    label: "転職・就職で重視すること",
  },
  {
    key: "expressionsToAvoid",
    label: "志望動機で避けたい表現",
  },
  { key: "additionalInformation", label: "その他の共通情報" },
];

export const EMPTY_APPLICANT_PROFILE: ApplicantProfile = {
  desiredRole: "",
  preferredWorkStyle: "",
  skillsAndTools: "",
  portfolioExperience: "",
  workExperience: "",
  qualifications: "",
  strengths: "",
  careerPriorities: "",
  expressionsToAvoid: "",
  additionalInformation: "",
};
