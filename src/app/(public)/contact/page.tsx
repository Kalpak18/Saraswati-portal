import { getSchoolInfo, mapEmbedUrl } from "@/lib/school";
import ContactContent from "./ContactContent";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const school = await getSchoolInfo();
  return (
    <ContactContent
      school={{
        name: school.name,
        address: school.address,
        map_url: school.map_url,
        map_embed_url: mapEmbedUrl(school.address),
        phone: school.phone,
        email: school.email,
        office_hours: school.office_hours,
        office_hours_mr: school.office_hours_mr,
      }}
    />
  );
}
