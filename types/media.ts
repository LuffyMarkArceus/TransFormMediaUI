export interface ImageMedia {
  id: string
  userID: string
  name: string
  type: "image"

  originalURL: string
  processedURL?: string
  thumbnailURL?: string
  
  format: string
  sizeBytes: number
  
  width?: number
  height?: number
  
  status: string
  createdAt: string
}