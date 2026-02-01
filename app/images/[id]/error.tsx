"use client";

export default function ErrorPage() {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-semibold">Something went wrong.</h2>
        <p className="text-center text-muted-foreground">
            An unexpected error occurred while loading the image. Please try again later.
        </p>
        </div>
    );
}