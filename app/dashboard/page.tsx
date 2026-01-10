import { auth } from "@clerk/nextjs/server"
import ImageGrid from "./image-grid"

export default function DashboardPage() {
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Your Images</h1>
        <p className="text-muted-foreground">
          Images you’ve uploaded to Universal Media Service
        </p>
      </div>

      <ImageGrid />
    </div>
  )
}