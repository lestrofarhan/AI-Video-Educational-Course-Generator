"use client";

import React, { useState } from "react";
import {
  Loader2,
  Play,
  Volume2,
  CheckCircle,
  AlertTriangle,
  FileJson,
  Sparkles,
} from "lucide-react";

export default function TestPanel() {
  // Mock State payload properties matching schema parameters
  const [courseId, setCourseId] = useState("test-course-123");
  const [courseName, setCourseName] = useState("Testing Engine Masterclass");
  const [chapterTitle, setChapterTitle] = useState(
    "Exploring Audio Pacing and Subtitle Sync",
  );
  const [chapterSlug, setChapterSlug] = useState(
    `test-slug-${Date.now().toString().slice(-4)}`,
  );
  const [subContentRaw, setSubContentRaw] = useState(
    "React components are the vital building blocks of modern user interfaces. They let you split the UI into independent, reusable pieces, and think about each piece in isolation.",
  );

  // Operations Tracking state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [responseLog, setResponseLog] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const triggerPipelineTest = async () => {
    setLoading(true);
    setError(null);
    setResponseLog(null);
    setPlayingAudio(null);

    // Transform sentence blocks smoothly into your required string array format
    const cleanSubContentArray = subContentRaw
      .split(".")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const res = await fetch("/api/generate-video-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          courseName,
          chapterTitle,
          chapterSlug,
          subContent: cleanSubContentArray.slice(0, 3), // Keep array within your 1-3 validation bounds
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Generation engine failed.",
        );
      }

      setResponseLog(data);
    } catch (err: any) {
      console.error("Test Interface Error Catch:", err);
      setError({
        message: err.message || "An unhandled execution crash occurred.",
        details:
          err.details ||
          "Check your terminal server console logs for full details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const playBase64Audio = (base64String: string) => {
    try {
      if (!base64String || base64String === "fallback_silent_indicator") {
        alert(
          "No valid audio file stream was saved inside this slide record column.",
        );
        return;
      }
      const audio = new Audio(base64String);
      setPlayingAudio(base64String);
      audio.play();
      audio.onended = () => setPlayingAudio(null);
    } catch (e) {
      alert("Audio playback failed. Verify base64 data strings are intact.");
      setPlayingAudio(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen text-slate-800">
      {/* Header Banner Section */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="text-amber-400 w-6 h-6 animate-pulse" /> Audio
            & Timeline Calibration Control Panel
          </h1>
          <p className="text-slate-400 text-sm">
            Verify the new keyless long-form text-to-speech audio rendering
            engine pipeline.
          </p>
        </div>
        <div className="bg-slate-800/80 px-4 py-1.5 rounded-lg border border-slate-700/50 text-xs font-mono text-indigo-300">
          Status: Ready for Injection
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: API Payload Mock Parameter Forms */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Payload Input Setup
          </h3>

          <div className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-600">Course Identifier (ID)</label>
                <input
                  type="text"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-indigo-500 text-slate-800 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-600">Chapter URL Slug</label>
                <input
                  type="text"
                  value={chapterSlug}
                  onChange={(e) => setChapterSlug(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-indigo-500 text-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-600">Course Name</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-600">
                Chapter Presentation Title
              </label>
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-600">
                Narration Content Text (Long-form Test Copy)
              </label>
              <textarea
                rows={5}
                value={subContentRaw}
                onChange={(e) => setSubContentRaw(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-indigo-500 font-sans text-sm leading-relaxed"
                placeholder="Type long narration scripts here to verify that the text cuts off nowhere..."
              />
              <p className="text-[11px] text-slate-400 font-normal mt-1">
                Sentences will be split cleanly by periods into an array format
                automatically.
              </p>
            </div>
          </div>

          <button
            onClick={triggerPipelineTest}
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-indigo-500/10 active:scale-[0.99] flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Compiling Engine
                Vectors...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Execute Synthesis Test
                Run
              </>
            )}
          </button>
        </div>

        {/* Right Column: Interactive Diagnostic Status Logs Output Panels */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Unhandled System Exceptions Panel */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-4 text-rose-900 animate-fade-in">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-2 w-full">
                <h4 className="text-sm font-bold">
                  Pipeline Operation Halted (400 / 500 Route Crash)
                </h4>
                <p className="text-xs text-rose-700 bg-rose-100/50 p-2.5 rounded-lg border border-rose-200/40 font-mono break-all">
                  {error.message}
                </p>
                {error.details && (
                  <p className="text-[11px] text-rose-600 font-normal leading-relaxed">
                    {error.details}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2. Audio Verification Testing Dashboard */}
          {responseLog &&
            responseLog.slides &&
            responseLog.slides.length > 0 && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-emerald-950">
                      Audio Render Pass Verified
                    </h4>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 font-bold uppercase rounded-full">
                    {responseLog.source || "Generated"}
                  </span>
                </div>

                {/* Loop through compiled active slides */}
                <div className="space-y-4">
                  {responseLog.slides.map((slide: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 font-mono">
                            Slide ID: {slide.slideId}
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            DB Data URI Size:{" "}
                            {((slide.audioFileUrl?.length || 0) / 1024).toFixed(
                              1,
                            )}{" "}
                            KB
                          </p>
                        </div>

                        <button
                          onClick={() => playBase64Audio(slide.audioFileUrl)}
                          className={`px-4 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 shadow-sm transition-colors ${
                            playingAudio === slide.audioFileUrl
                              ? "bg-amber-50 border-amber-300 text-amber-700 animate-pulse"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          {playingAudio === slide.audioFileUrl
                            ? "Vocalizing Content..."
                            : "Test Play Audio"}
                        </button>
                      </div>

                      {/* Timeline Captions Visual Matrix */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <FileJson className="w-3 h-3" /> Timeline Caption Maps
                        </label>
                        <div className="flex flex-wrap gap-1.5 p-3 bg-slate-900 rounded-xl max-h-[140px] overflow-y-auto border border-slate-950 shadow-inner">
                          {slide.captions &&
                          Array.isArray(slide.captions) &&
                          slide.captions.length > 0 ? (
                            slide.captions.map((cap: any, cIdx: number) => (
                              <div
                                key={cIdx}
                                className="bg-slate-800 border border-slate-700/60 px-2 py-1 rounded text-center text-[11px] font-mono leading-none flex flex-col gap-1 select-none"
                              >
                                <span className="text-amber-400 font-sans font-bold">
                                  {cap.text}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {cap.start}s - {cap.end}s
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-500 text-xs italic">
                              No caption maps generated.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 3. Raw Response Inspector Stream Terminal */}
          <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl shadow-xl font-mono text-xs space-y-3 border border-slate-950 relative">
            <div className="flex justify-between items-center text-slate-500 border-b border-slate-800 pb-2 text-[10px] uppercase font-bold tracking-wider">
              <span>JSON Raw Stream Out Diagnostics</span>
              <span>Terminal</span>
            </div>
            <pre className="overflow-auto max-h-[340px] p-2 bg-slate-950/40 rounded-lg text-indigo-300 leading-relaxed break-all whitespace-pre-wrap">
              {responseLog
                ? JSON.stringify(responseLog, null, 2)
                : "// Awaiting pipeline initialization command telemetry logs..."}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
