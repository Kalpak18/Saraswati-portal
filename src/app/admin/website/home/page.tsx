import { PageBuilder } from "./PageBuilder";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home page" };

export default function HomeBuilderPage() {
  return <PageBuilder page="home" />;
}
