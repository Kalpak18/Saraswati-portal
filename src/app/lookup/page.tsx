import LookupForm from "./LookupForm";
import { getSchoolInfo } from "@/lib/school";

export default async function LookupPage() {
  const school = await getSchoolInfo();
  return <LookupForm school={{ name: school.name, name_mr: school.name_mr, logo_url: school.logo_url }} />;
}
