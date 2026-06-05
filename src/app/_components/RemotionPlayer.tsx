"use client";

import React, { useEffect, useRef } from "react";
import { Audio, useCurrentFrame, useVideoConfig, Series } from "remotion";

interface WordCaption {
  word: string;
  start: number;
  end: number;
}

interface Slide {
  slideId: string;
  slideIndex: number;
  title: string;
  htmlContent: string;
  audioFileUrl: string | null;
  captions: { words: WordCaption[] } | any;
}

// Track render controller executing calculations on individual active slide segments
function SingleSlideTrack({ slide }: { slide: Slide }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTimeInSeconds = frame / fps;

  // Mount compiled dynamic styling contents natively inside the component canvas tracking root
  useEffect(() => {
    if (containerRef.current && slide.htmlContent) {
      containerRef.current.innerHTML = slide.htmlContent;
    }
  }, [slide.htmlContent]);

  // Read raw subtitle arrays to resolve what string matches current frame execution timestamps
  const currentWords = slide.captions?.words || [];
  const activeWordObj = currentWords.find(
    (w: WordCaption) =>
      currentTimeInSeconds >= w.start && currentTimeInSeconds <= w.end,
  );

  return (
    <div className="relative w-full h-full bg-zinc-950 overflow-hidden select-none">
      {/* Target injection view frame */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Quiet Luxury Active Subtitle Overlay */}
      {activeWordObj && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 bg-black/90 px-6 py-3 rounded-2xl border border-zinc-800/60 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] max-w-[85%] text-center">
          <p className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white">
            {activeWordObj.word}
          </p>
        </div>
      )}

      {/* Audio Render Pipeline Entry */}
      {slide.audioFileUrl && <Audio src={slide.audioFileUrl} />}
    </div>
  );
}

// Master Sequence Coordinator wrapping separate segment configurations cleanly
export function RemotionVideoEngine({ slides }: { slides: Slide[] }) {
  const { fps } = useVideoConfig();

  if (!slides || slides.length === 0) return null;

  return (
    <Series>
      {slides.map((slide) => {
        const wordsArray = slide.captions?.words || [];

        // Find maximum frame timeline boundary parameter via last elements array configurations
        const lastWordEndTime =
          wordsArray.length > 0 ? wordsArray[wordsArray.length - 1].end : 5;

        // Apply fallback calculations and pad transition limits to safely prevent layout jumps
        const slideDurationInFrames = Math.ceil((lastWordEndTime + 0.5) * fps);

        return (
          <Series.Sequence
            key={slide.slideId}
            durationInFrames={slideDurationInFrames}
          >
            <SingleSlideTrack slide={slide} />
          </Series.Sequence>
        );
      })}
    </Series>
  );
}
