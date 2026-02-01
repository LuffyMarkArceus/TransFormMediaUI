import { auth } from "@clerk/nextjs/server";
import UploadDropzone from "@/components/UploadDropZone";
import { redirect } from "next/navigation";
import { ImageMedia } from "@/types/media"

export default async function UploadPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
      <UploadDropzone onUploadComplete={function (media: ImageMedia): void {
        throw new Error("Function not implemented.");
      } } />
    </div>
  );
}
