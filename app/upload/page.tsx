import { auth } from "@clerk/nextjs/server";
import UploadDropzone from "@/components/UploadDropZone";
import { redirect } from "next/navigation";

export default async function UploadPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
      <UploadDropzone />
    </div>
  );
}
