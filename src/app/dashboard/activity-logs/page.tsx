import { redirect } from "next/navigation";

export default function OldActivityLogsRedirect() {
  redirect("/dashboard/activity/logs");
}
