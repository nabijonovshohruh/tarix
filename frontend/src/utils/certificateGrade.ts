import { CertGrade } from "../api/types";

export const certGradeLabels: Record<CertGrade, string> = {
  NONE: "—",
  C: "C",
  C_PLUS: "C+",
  B: "B",
  B_PLUS: "B+",
  A: "A",
  A_PLUS: "A+",
};

export const certGradeTone: Record<CertGrade, "success" | "warning" | "neutral" | "danger"> = {
  NONE: "danger",
  C: "neutral",
  C_PLUS: "neutral",
  B: "warning",
  B_PLUS: "warning",
  A: "success",
  A_PLUS: "success",
};
