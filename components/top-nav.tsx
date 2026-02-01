"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "./ui/skeleton";

export function TopNav() {
  const { isLoaded } = useUser();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Left */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="text-lg">🖼</span>
          <span className="text-sm sm:text-base">
            Universal Media
          </span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isLoaded && <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />}
        </div>
      </div>
    </header>
  );
}
