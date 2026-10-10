import { PageBuilder } from "../home/PageBuilder";

export const dynamic = "force-dynamic";
export const metadata = { title: "About page" };

export default function AboutBuilderPage() {
  return <PageBuilder page="about" />;
}
