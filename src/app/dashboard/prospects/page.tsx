import { redirect } from "next/navigation";

export default function ProspectsRedirect() {
  redirect("/dashboard/parasite-posting/compose");
}
