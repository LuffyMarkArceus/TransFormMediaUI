"use client";

export default function LoadingPage() {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
            <h2 className="text-2xl font-semibold">Loading image...</h2>
        </div>
    );
}