import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

/** Upload lives on the dashboard; keep this route as a stable bookmark. */
export default async function UploadPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  redirect("/dashboard")
}
