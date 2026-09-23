import { redirect } from "next/navigation";

export default function Home() {
  // Parents land on lookup; admins go to /login directly.
  redirect("/lookup");
}
