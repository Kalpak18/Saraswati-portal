import ImportWizard from "./ImportWizard";
import { loadRoster } from "../roster";

export const dynamic = "force-dynamic";
export const metadata = { title: "Import achievements" };

export default async function ImportAchievementsPage() {
  const roster = await loadRoster();
  return <ImportWizard roster={roster} />;
}
