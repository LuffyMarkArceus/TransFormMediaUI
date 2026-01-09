"use client";

import { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";

export default function UploadDropzone() {
  const { getToken } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function upload() {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);
    setError("");

    try {
      const token = await getToken();

      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        "http://localhost:8080/api/v1/images",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (e) => {
            if (!e.total) return;
            setProgress(Math.round((e.loaded * 100) / e.total));
          },
        }
      );

      setStatus("success");
      setFile(null);
    } catch (err: any) {
      setStatus("error");
      setError(err?.response?.data?.error || "Upload failed");
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-neutral-900 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Upload Image</h2>

      <label
        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 transition"
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <span className="text-sm text-gray-500">
          {file ? file.name : "Click to select image"}
        </span>
      </label>

      {status === "uploading" && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-1">{progress}%</p>
        </div>
      )}

      {status === "error" && (
        <p className="text-red-500 text-sm mt-3">{error}</p>
      )}

      {status === "success" && (
        <p className="text-green-500 text-sm mt-3">
          ✅ Upload successful
        </p>
      )}

      <button
        onClick={upload}
        disabled={!file || status === "uploading"}
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        Upload
      </button>
    </div>
  );
}
