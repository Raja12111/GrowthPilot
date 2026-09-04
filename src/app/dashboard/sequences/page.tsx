import { redirect } from "next/navigation";

export default function SequencesRedirect() {
  redirect("/dashboard/parasite-posting/compose");
}
