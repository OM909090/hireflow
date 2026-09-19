import { PageHeader } from "@/components/hireflow/app-shell";
import { MatrixView } from "@/components/hireflow/matrix-view";

export const metadata = {
  title: "Evidence Matrix — HireFlow",
};

export default function MatrixPage() {
  return (
    <>
      <PageHeader
        eyebrow="Evidence matrix"
        title="Every candidate against every requirement"
        subtitle="One grid, no scores. Each cell is a verdict backed by located evidence or a flagged gap — filter it, click any cell for the reasoning, and watch it update live as the AI verifies requirements in interviews."
      />
      <MatrixView />
    </>
  );
}
