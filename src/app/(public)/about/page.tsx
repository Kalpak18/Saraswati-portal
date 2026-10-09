import { PageSections } from "../components/PageSections";

export const metadata = { title: "About" };

/** The About page is built in Website → About page, like the home page. */
export default function AboutPage() {
  return <PageSections page="about" />;
}
