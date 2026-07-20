import { redirect } from "next/navigation";

export default function OldNotificationsRedirect() {
  redirect("/dashboard/notifications");
}
