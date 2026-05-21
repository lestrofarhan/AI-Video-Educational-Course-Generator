// src/app/layout.tsx
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import AppProvider from "./provider";
import { Toaster } from "sonner";

const AppFont = DM_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VidCourse - AI Video Course Generator",
  description:
    "Turn any topic into a complete custom structured course using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        {/* Added overflow-x-hidden and relative positioning to the body to host background blur circles perfectly */}
        <body
          className={`${AppFont.className} relative min-h-screen bg-background overflow-x-hidden antialiased`}
        >
          {/* Universal Background Ambient Mesh Gradients (Shows up behind every page) */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Soft Indigo Top-Right Glow */}
            <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-200/40 blur-[120px] sm:w-[800px] sm:h-[800px]" />

            {/* Vibrant Soft Cyan/Blue Center-Left Ambient Orb */}
            <div className="absolute top-[20%] -left-[20%] w-[500px] h-[650px] rounded-full bg-sky-200/30 blur-[130px] sm:w-[700px] sm:h-[900px]" />

            {/* Subtle Bottom Purple Balance Spot */}
            <div className="absolute bottom-0 right-[15%] w-[400px] h-[400px] rounded-full bg-purple-100/30 blur-[100px]" />
          </div>

          {/* Core Interactive Layout Canvas sitting safely above background layers */}
          <div className="relative z-10 min-h-screen flex flex-col">
            <AppProvider>{children}</AppProvider>
          </div>

          {/* Global Sonner Toast Notifications Container */}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
