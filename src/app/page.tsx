// src/app/page.tsx
"use client";

import React, { useState } from "react";
import Header from "./_components/Header";
import { PROMPT_SUGGESTIONS } from "@/data/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SendHorizontal } from "lucide-react";

export default function LandingPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [courseType, setCourseType] = useState<string>("full");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSuggestionClick = (
    selectedPrompt: string,
    selectedType: "full" | "quick",
  ) => {
    setPrompt(selectedPrompt);
    setCourseType(selectedType);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      console.log("Dispatching request payload:", { prompt, courseType });
      // TODO: Connect database generation logic here
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Container: Adjusted padding to change smoothly from mobile (px-4, pt-12) to desktop (md:pt-24) */}
      <main className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 pt-12 pb-16 text-center md:px-6 md:pt-24">
        {/* Core Hero Typographic Cluster */}
        <div className="space-y-3 px-2">
          {/* Dynamic text sizing from text-3xl on mobile to text-[44px] on desktop */}
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-[44px] leading-tight">
            Learn Smarter with{" "}
            <span className="text-[#2563eb]">AI Video Courses</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 sm:text-base md:text-[17px]">
            Turn Any Topic into a Complete Course
          </p>
        </div>

        {/* Compound Prompt Box Enclosure Block */}
        <div className="mt-8 w-full max-w-2xl rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:border-zinc-300 transition-all text-left">
          {/* Responsive min-height for textarea to prevent excessive scrolling on small screens */}
          <textarea
            placeholder="What do you want to learn today?..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full min-h-[90px] md:min-h-[110px] bg-transparent p-2 text-[15px] text-zinc-800 placeholder-zinc-400 outline-none resize-none"
          />

          {/* Action Row: Stacks vertically on mobile (flex-col items-stretch gap-3) and snaps back to horizontal on desktop (sm:flex-row sm:items-center sm:justify-between) */}
          <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100 px-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            {/* Embedded Inline Shadcn Dropdown Trigger */}
            <div className="w-full sm:w-[160px]">
              <Select value={courseType} onValueChange={setCourseType}>
                <SelectTrigger className="h-9 w-full border-none bg-zinc-50 text-xs font-semibold text-zinc-600 focus:ring-0 rounded-lg shadow-none px-3 cursor-pointer">
                  <SelectValue placeholder="Select Layout Mode" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-zinc-200 shadow-xl rounded-xl text-xs">
                  <SelectItem
                    value="full"
                    className="font-medium focus:bg-zinc-100 focus:text-black py-2 cursor-pointer"
                  >
                    Full Course
                  </SelectItem>
                  <SelectItem
                    value="quick"
                    className="font-medium focus:bg-zinc-100 focus:text-black py-2 cursor-pointer"
                  >
                    Quick Explainer Video
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Micro Action Button: Expands to full-width text button on mobile for easier thumb tracking, turns into a sleek icon box on desktop */}
            <button
              disabled={loading || !prompt.trim()}
              onClick={handleGenerate}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1a73e8] text-white transition-all hover:bg-[#155cb4] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm sm:h-9 sm:w-9 sm:gap-0"
            >
              <span className="text-xs font-semibold sm:hidden">
                Generate Layout
              </span>
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Layout Suggestion Badge List Container */}
        <div className="mt-7 w-full max-w-2xl px-1">
          {/* flex-wrap ensures components fall down to a new line gracefully on smaller breakpoints */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PROMPT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() =>
                  handleSuggestionClick(suggestion.prompt, suggestion.type)
                }
                className="cursor-pointer text-[11px] md:text-xs rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 flex items-center gap-1 whitespace-nowrap"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
