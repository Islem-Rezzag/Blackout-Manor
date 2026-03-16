import { FairnessDashboard } from "@/features/fairness/FairnessDashboard";
import { loadFairnessReport } from "@/features/fairness/loadFairnessReport";

export default async function FairnessPage() {
  const { report, source } = await loadFairnessReport();

  return <FairnessDashboard report={report} source={source} />;
}
