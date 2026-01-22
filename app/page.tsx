"use client";

import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <SignedOut>
        <div className="max-w-md space-y-6 text-center">
          <h1 className="text-3xl font-bold">
            Welcome to Universal Media Service
          </h1>

          <p className="text-muted-foreground">
            Sign in to manage and process your images.
          </p>

          <SignIn routing="hash"/>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Client-safe redirect */}
        <RedirectToDashboard />
      </SignedIn>
    </main>
  );
}

function RedirectToDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return <p>Redirecting to dashboard…</p>;
}
