import { redirect } from "next/navigation";

// Natural-language querying now lives inside the Candidate Pool (it should not
// be an isolated feature). This route redirects there.
export default function AskPage() {
  redirect("/candidates");
}
