// Redirect /dsa → /practice (DSA Tracker superseded by DSA Practice Hub)
import { redirect } from "next/navigation";
export default function DSAPage() {
  redirect("/practice");
}
