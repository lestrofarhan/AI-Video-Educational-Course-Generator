"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Send,
  Sparkles,
  Volume2,
} from "lucide-react";

type PresetKey =
  | "seed"
  | "course"
  | "details"
  | "userCourses"
  | "userSync"
  | "custom"
  | "generateLayout"
  | "generateSlides"; // Swapped tts key with generateSlides

const presets: Record<
  PresetKey,
  { label: string; method: string; path: string; body?: string }
> = {
  seed: {
    label: "Seed demo courses",
    method: "POST",
    path: "/api/dev/seed-courses",
  },
  course: {
    label: "Lookup course",
    method: "POST",
    path: "/api/courses/course",
    body: JSON.stringify({ courseId: "demo-nextjs-foundations" }, null, 2),
  },
  details: {
    label: "Get course details",
    method: "GET",
    path: "/api/courses/get-details",
  },
  userCourses: {
    label: "List my courses",
    method: "GET",
    path: "/api/user-courses",
  },
  userSync: {
    label: "Sync Clerk user",
    method: "POST",
    path: "/api/user",
  },
  custom: {
    label: "Custom request",
    method: "POST",
    path: "/api/courses/course",
    body: JSON.stringify({ courseId: "demo-nextjs-foundations" }, null, 2),
  },
  generateLayout: {
    label: "Generate layout",
    method: "POST",
    path: "/api/courses/generate-layout",
    body: JSON.stringify(
      { prompt: "Next.js app fundamentals", type: "full" },
      null,
      2,
    ),
  },
  // Updated config preset pointing directly to your new integrated slide generator endpoint
  generateSlides: {
    label: "Generate Course Slides & Audio",
    method: "POST",
    path: "/api/courses/generate",
    body: JSON.stringify(
      {
        courseId: "07444e02-af3e-44fd-bc75-f012ceda05fd",
        courseName: "Introduction to React",
        chapter: {
          chapterId: "props-state",
          chapterTitle: "Props and State in React",
          subContent: [
            "Understanding props and how to pass data between components",
            "Introduction to state and its role in React components",
            "Basic state updates and rendering",
          ],
        },
      },
      null,
      2,
    ),
  },
};

export default function TestPanel() {
  const [preset, setPreset] = useState<PresetKey>("seed");
  const [method, setMethod] = useState("POST");
  const [path, setPath] = useState("/api/dev/seed-courses");
  const [courseId, setCourseId] = useState("demo-nextjs-foundations");
  const [bodyText, setBodyText] = useState(
    JSON.stringify({ courseId: "demo-nextjs-foundations" }, null, 2),
  );
  const [prompt, setPrompt] = useState("Next.js app fundamentals");
  const [modeSelect, setModeSelect] = useState("full");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<any>(null);

  const applyPreset = (nextPreset: PresetKey) => {
    const config = presets[nextPreset];
    setPreset(nextPreset);
    setMethod(config.method);
    setPath(config.path);
    setBodyText(config.body || "{}");

    if (nextPreset === "generateLayout") {
      try {
        const parsed = config.body ? JSON.parse(config.body) : {};
        setPrompt(parsed.prompt || "");
        setModeSelect(parsed.type || "full");
      } catch {
        setPrompt("");
        setModeSelect("full");
      }
    }
    setErrorText("");
    setResponseBody(null);
    setResponseStatus(null);
  };

  const executeRequest = async () => {
    setLoading(true);
    setErrorText("");
    setResponseBody(null);
    setResponseStatus(null);

    try {
      const url = new URL(path, window.location.origin);
      const init: RequestInit = {
        method,
        credentials: "include",
      };

      const shouldSendCourseId =
        path.includes("/api/courses/get-details") || preset === "details";

      if (shouldSendCourseId) {
        const trimmed = courseId.trim();
        if (trimmed) {
          url.searchParams.set("courseId", trimmed);
        }
      }

      if (method !== "GET") {
        init.headers = { "Content-Type": "application/json" };

        if (
          preset === "course" ||
          preset === "custom" ||
          preset === "details"
        ) {
          init.body = JSON.stringify({ courseId: courseId.trim() });
        } else if (preset === "seed" || preset === "userSync") {
          init.body = "{}";
        } else {
          if (preset === "generateLayout") {
            init.body = JSON.stringify({
              prompt: prompt.trim(),
              type: modeSelect,
            });
          } else {
            // Catches general configuration blocks (like generateSlides) and routes the active text payload
            init.body = bodyText.trim() || "{}";
          }
        }
      }

      const response = await fetch(url.toString(), init);
      const rawText = await response.text();

      let parsed: any = rawText;
      try {
        parsed = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsed = rawText;
      }

      setResponseStatus(response.status);
      setResponseBody(parsed);

      if (!response.ok) {
        setErrorText(
          parsed?.message ||
            parsed?.error ||
            `Request failed with status ${response.status}`,
        );
      }
    } catch (error: any) {
      setErrorText(error?.message || "Request failed unexpectedly.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = (dataUri: string) => {
    try {
      const audio = new Audio(dataUri);
      audio.play();
    } catch (err) {
      console.error("Audio playback crashed", err);
    }
  };

  const responsePreview =
    responseBody === null
      ? "No response yet. Run a request to inspect the payload."
      : typeof responseBody === "string"
        ? responseBody
        : JSON.stringify(responseBody, null, 2);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.96),rgba(15,23,42,1)_44%,rgba(241,245,249,1)_44%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" /> Authenticated API
                playground
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Seed data, test Clerk-backed APIs, and inspect JSON responses
                without Postman.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Requests are sent from your browser session, so Clerk cookies
                stay attached. Use the presets to seed demo courses and test the
                course lookup flow quickly.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs sm:flex sm:flex-wrap">
              <button
                onClick={() => applyPreset("seed")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Seed demo data
              </button>
              <button
                onClick={() => applyPreset("course")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Test lookup
              </button>
              <button
                onClick={() => applyPreset("details")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Test details
              </button>
              <button
                onClick={() => applyPreset("userCourses")}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                My courses
              </button>
              {/* Slide Generator Quick-Action Preset Toggle Button */}
              <button
                onClick={() => applyPreset("generateSlides")}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <Volume2 className="h-3.5 w-3.5" /> Generate Slides
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
                  Request builder
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Preset: {presets[preset].label}
                </p>
              </div>
              <FlaskConical className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Preset
                </label>
                <select
                  value={preset}
                  onChange={(e) => applyPreset(e.target.value as PresetKey)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                >
                  {Object.entries(presets).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Method
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Course ID
                  </label>
                  <input
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    placeholder="demo-nextjs-foundations"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Path
                </label>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono outline-none transition focus:border-slate-400"
                  placeholder="/api/courses/course"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Prompt (for generate-layout)
                </label>
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  placeholder="Create a beginner course on React hooks"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Mode
                </label>
                <select
                  value={modeSelect}
                  onChange={(e) => setModeSelect(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                >
                  <option value="full">full</option>
                  <option value="quick">quick</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Body
                  </label>
                  <span className="text-[11px] text-slate-400">
                    JSON for non-GET requests
                  </span>
                </div>
                <textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={12}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-slate-100 outline-none transition focus:border-slate-400"
                />
              </div>

              <button
                onClick={executeRequest}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Run request
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {errorText ? (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                  <div>
                    <h3 className="text-sm font-bold">Request failed</h3>
                    <p className="mt-2 text-sm leading-6 text-rose-800">
                      {errorText}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">
                    Response
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {responseStatus === null
                      ? "Waiting for a request."
                      : `HTTP ${responseStatus}`}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Clerk session active in browser
                </div>
              </div>

              {/* Enhanced Audio Testing Suite: Maps out individual slide playback rows dynamically */}
              {responseBody?.success && Array.isArray(responseBody?.slides) && (
                <div className="mt-5 space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <div>
                    <p className="text-xs font-bold text-emerald-900">
                      Generated Chapter Slides Asset Tracker
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      Chapter Target Link:{" "}
                      <code className="font-mono bg-emerald-100/60 px-1 py-0.5 rounded">
                        {responseBody.chapterId}
                      </code>
                    </p>
                  </div>
                  <div className="divide-y divide-emerald-100/60">
                    {responseBody.slides.map((slide: any) => (
                      <div
                        key={slide.slideId}
                        className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-slate-800">
                            Slide {slide.slideIndex}:{" "}
                            {slide.title || "Untitled Slide"}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            ID: {slide.slideId} | {slide.revelData?.length || 0}{" "}
                            reveals mapped
                          </p>
                        </div>
                        {slide.audioFileUrl ? (
                          <button
                            onClick={() => handlePlayAudio(slide.audioFileUrl)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-emerald-700 shadow-sm"
                          >
                            <Volume2 className="h-3 w-3" /> Audio Sample
                          </button>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-medium">
                            Audio missing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <pre className="mt-5 max-h-[72vh] overflow-auto rounded-[24px] bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                {responsePreview}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
