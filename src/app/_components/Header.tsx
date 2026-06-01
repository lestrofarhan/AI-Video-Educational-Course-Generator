// src/app/_components/Header.tsx
"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/UserDetailContext";
import Image from "next/image";

export default function Header() {
  const { isSignedIn } = useUser();
  const context = useContext(UserDetailContext);
console.log("[Header Component] User Detail Context:", context); // Debug log to verify context values

  return (
    <header className="w-full bg-background border-b border-zinc-100 px-4 py-4 sm:px-6 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Left Side: Brand Identity Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground transition-opacity hover:opacity-90 sm:text-xl"
        >
          <div className="flex h-7 w-8 items-center justify-center rounded bg-zinc-100 border text-sm shadow-sm sm:w-9 sm:text-base">
            <Image src="/logo.png" alt="VidCourse Logo" width={32} height={32} />
          </div>
          <span className="font-sans font-extrabold text-lg sm:text-[22px]">
            Vid<span className="text-[#2563eb]">Course</span>
          </span>
        </Link>

        {/* Center: Main App Nav Links */}
        {/* 'hidden sm:flex' ensures links stay hidden on mobile screens to prevent clutter, then displays cleanly on tablets and desktops */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold text-zinc-800 md:gap-8 md:text-[15px]">
          <Link href="/" className="transition-colors hover:text-[#2563eb]">
            Home
          </Link>
          <Link
            href="/pricing"
            className="transition-colors hover:text-[#2563eb]"
          >
            Pricing
          </Link>
        </nav>

        {/* Right Side: Dynamic Authentication Group */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isSignedIn ? (
            <div className="flex items-center gap-2 sm:gap-4">
             
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "h-7 w-7 sm:h-8 sm:w-8 ring-1 ring-border shadow-sm",
                  },
                }}
              />
            </div>
          ) : (
              
              <Link href="/sign-in" className="cursor-pointer rounded-lg bg-[#1a73e8] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#155cb4] active:scale-[0.98] sm:px-5 sm:py-2 sm:text-sm">
                Get Started
              </Link>
          )}
        </div>
      </div>
    </header>
  );
}
