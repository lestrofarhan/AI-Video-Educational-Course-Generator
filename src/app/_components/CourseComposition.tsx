"use client";

import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig } from "remotion";
import React from "react";

interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

interface CompositionProps {
  title: string;
  subtitle: string;
  htmlContent: string;
  audioFileUrl: string;
  captions?: CaptionWord[];
}

export const CourseComposition: React.FC<CompositionProps> = ({
  title,
  subtitle,
  htmlContent,
  audioFileUrl,
  captions = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate exact current playback time in seconds
  const currentTimeSeconds = frame / fps;

  return (
    <AbsoluteFill className="bg-[#0b0f19] text-white flex flex-col justify-between p-12 font-sans select-none">
      {/* Background Ambient Decorative Glow Vectors */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Slide Upper Header Metrics */}
      <div className="space-y-1.5 z-10 border-l-4 border-indigo-500 pl-4 animate-fade-in">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          {title || "Default Component Chapter Title"}
        </h2>
        <p className="text-xs font-mono tracking-widest text-indigo-400 font-semibold uppercase">
          {subtitle || "Automated Architecture Layout Matrix"}
        </p>
      </div>

      {/* Main Slide Interactive HTML Canvas Container */}
      <div className="my-auto z-10 py-4 max-w-4xl text-slate-200 text-lg leading-relaxed antialiased">
        {htmlContent ? (
          <div
            className="prose prose-invert max-w-none text-xl space-y-4 data-html-frame-render"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div className="text-slate-500 italic text-sm">
            Awaiting token matrix layout parameters...
          </div>
        )}
      </div>

      {/* Bottom Subtitle/Caption Track Panel */}
      <div className="w-full min-h-[70px] bg-slate-950/40 border border-slate-800/40 backdrop-blur-md rounded-2xl p-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 z-10 shadow-xl">
        {captions && captions.length > 0 ? (
          captions.map((wordObj, idx) => {
            // Determine highlight state context checking if playback line intercepts boundaries
            const isActive =
              currentTimeSeconds >= wordObj.start &&
              currentTimeSeconds <= wordObj.end;

            return (
              <span
                key={idx}
                className={`text-xl font-bold tracking-tight transition-all duration-150 rounded px-1 ${
                  isActive
                    ? "text-amber-400 bg-amber-500/10 scale-105 shadow-sm border border-amber-500/20"
                    : "text-slate-400/80"
                }`}
              >
                {wordObj.text}
              </span>
            );
          })
        ) : (
          <p className="text-xs font-mono text-slate-500 tracking-wider uppercase animate-pulse">
            System Narration Stream Standby
          </p>
        )}
      </div>

      {/* Native High-Fidelity Streaming Audio Render Engine Overlay */}
      {audioFileUrl && audioFileUrl !== "fallback_silent_indicator" && (
        <Audio src={audioFileUrl} />
      )}
    </AbsoluteFill>
  );
};
