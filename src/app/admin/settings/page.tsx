import { getSchoolInfo } from "@/lib/school";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  // Shows the defaults (address + map link) when nothing has been saved yet.
  const data = await getSchoolInfo();

  return (
    <SettingsClient
      initial={{
        name: data.name ?? "",
        name_mr: data.name_mr,
        phone: data.phone ?? "",
        email: data.email ?? "",
        office_hours: data.office_hours ?? "",
        office_hours_mr: data.office_hours_mr ?? "",
        address: data.address,
        map_url: data.map_url,
        logo_url: data.logo_url,
      }}
      theme={data.theme}
      branding={data.branding}
    />
  );
}
