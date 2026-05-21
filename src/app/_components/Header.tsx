// src/app/_components/Header.tsx
"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/UserDetailContext";

export default function Header() {
  const { isSignedIn } = useUser();
  const context = useContext(UserDetailContext);

  return (
    <header className="w-full bg-background border-b border-zinc-100 px-4 py-4 sm:px-6 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Left Side: Brand Identity Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground transition-opacity hover:opacity-90 sm:text-xl"
        >
          <div className="flex h-7 w-8 items-center justify-center rounded bg-zinc-100 border text-sm shadow-sm sm:w-9 sm:text-base">
            🎬
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
              {/* Token balance badge adapts its padding and text size smoothly on smaller screens */}
              <div className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm sm:px-3.5 sm:text-xs">
                <span>Credits:</span>
                <span className="text-foreground font-bold">
                  {context?.userDetail?.credits ?? 0}
                </span>
              </div>
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
            <SignInButton mode="modal">
              {/* 'px-3 py-1.5 text-xs' on mobile scales up cleanly to 'sm:px-5 sm:py-2 sm:text-sm' */}
              <button className="cursor-pointer rounded-lg bg-[#1a73e8] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#155cb4] active:scale-[0.98] sm:px-5 sm:py-2 sm:text-sm">
                Get Started
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
