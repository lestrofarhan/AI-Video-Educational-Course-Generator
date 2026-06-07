"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Player } from "@remotion/player";
import Header from "@/app/_components/Header";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  Video,
  Clock3,
  Layers3,
} from "lucide-react";
import { RemotionVideoEngine } from "@/app/_components/RemotionPlayer";
import { Badge } from "@/components/ui/badge";

export default function CourseViewerPage() {
  const { courseId } = useParams();
  const targetId = Array.isArray(courseId) ? courseId[0] : courseId;

  // Pipeline Processing & Orchestration States
  const [loading, setLoading] = useState(true);
  const [pipelineStatus, setPipelineStatus] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consolidated Database Payloads
  const [courseRecord, setCourseRecord] = useState<any>(null);
  const [chaptersWithSlides, setChaptersWithSlides] = useState<any[]>([]);
  const [activeChapter, setActiveChapter] = useState<any>(null);

  // Remotion Dynamic Duration Calculator state
  const [computedTotalFrames, setComputedTotalFrames] = useState<number>(
    30 * 120,
  ); // Default placeholder 2 mins

  const fetchCourseDataFromDb = async () => {
    const res = await fetch("/api/courses/course", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: targetId }),
    });
    return await res.json();
  };

  const handlePipelineSequence = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      setPipelineStatus("Checking asset catalog maps inside Neon DB...");
      const checkData = await fetchCourseDataFromDb();

      const hasLayout = checkData.success && checkData.exists;
      const hasSlidesCompiled =
        hasLayout &&
        Array.isArray(checkData.chaptersWithSlides) &&
        checkData.chaptersWithSlides.length > 0 &&
        checkData.chaptersWithSlides.some(
          (ch: any) => ch.slides && ch.slides.length > 0,
        );

      if (hasLayout && hasSlidesCompiled) {
        setCourseRecord(checkData.course);
        setChaptersWithSlides(checkData.chaptersWithSlides || []);

        if (checkData.chaptersWithSlides?.[0]) {
          handleChapterSelect(checkData.chaptersWithSlides[0]);
        }
        setLoading(false);
        return;
      }

      let currentCourseName = checkData.course?.courseName;
      let rawChaptersArray = checkData.course?.courseLayout?.chapters || [];

      if (!hasLayout) {
        setPipelineStatus(
          "Course mapping missing. Initializing AI structural blueprints via Gemini...",
        );
        const layoutRes = await fetch("/api/courses/generate-layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: targetId,
            prompt: "Semantic HTML5: Structure & Accessibility",
            type: "full",
          }),
        });

        const layoutData = await layoutRes.json();
        if (!layoutRes.ok || !layoutData.success) {
          throw new Error(
            layoutData.message ||
              "Failed during course architecture blueprint assembly.",
          );
        }
        currentCourseName =
          layoutData.courseName || "Semantic HTML5 Masterclass";
        rawChaptersArray = layoutData.courseLayout?.chapters || [];
      } else {
        setPipelineStatus(
          "Layout structure verified. Initiating missing slide rendering sequences...",
        );
      }

      for (let i = 0; i < rawChaptersArray.length; i++) {
        const chapter = rawChaptersArray[i];
        const targetChapterId = chapter.chapterId || `ch-${i + 1}`;
        const normalizationPayload = {
          ...chapter,
          chapterId: targetChapterId,
        };

        setPipelineStatus(
          `Processing Chapter [${i + 1}/${rawChaptersArray.length}]: ${chapter.title || chapter.chapterTitle}...`,
        );

        const slideRes = await fetch("/api/courses/generate-course-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: targetId,
            courseName: currentCourseName || "Semantic HTML5 Masterclass",
            chapter: normalizationPayload,
          }),
        });

        if (!slideRes.ok) {
          const slideError = await slideRes.json();
          throw new Error(
            `[${chapter.title || chapter.chapterTitle}] Processing Timeout: ${slideError.message || "Microservice exhausted"}`,
          );
        }
      }

      setPipelineStatus(
        "Consolidating database structures and deploying Whisper timelines...",
      );
      const secondaryCheck = await fetchCourseDataFromDb();
      if (secondaryCheck.success && secondaryCheck.exists) {
        setCourseRecord(secondaryCheck.course);
        setChaptersWithSlides(secondaryCheck.chaptersWithSlides || []);
        if (secondaryCheck.chaptersWithSlides?.[0]) {
          handleChapterSelect(secondaryCheck.chaptersWithSlides[0]);
        }
      }
    } catch (err: any) {
      console.error("Pipeline breakdown sequence executed:", err);
      setErrorMessage(
        err?.message || "An unexpected production engine exception happened.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChapterSelect = (chapter: any) => {
    setActiveChapter(chapter);

    const FPS = 30;
    let runningFramesCounter = 0;

    const targetSlides = chapter.slides || [];
    targetSlides.forEach((slide: any) => {
      const words = slide.captions?.words || [];
      const endMarkerSeconds =
        words.length > 0 ? words[words.length - 1].end : 5;
      runningFramesCounter += Math.ceil((endMarkerSeconds + 0.5) * FPS);
    });

    setComputedTotalFrames(runningFramesCounter || FPS * 10);
  };

  useEffect(() => {
    if (targetId) {
      handlePipelineSequence();
    }
  }, [targetId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-zinc-900">
        <Loader2 className="w-9 h-9 animate-spin text-[#2563eb] mb-4" />
        <p className="text-xs font-semibold tracking-wide text-zinc-500 animate-pulse">
          {pipelineStatus}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans antialiased selection:bg-blue-500/10">
      <Header />

      {/* Synchronized Clean Header Area */}
      <header className="border-b border-zinc-200 bg-white py-12 px-4 md:px-8 lg:px-16 text-left">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 shadow-sm">
              <Layers3 className="h-3.5 w-3.5 text-[#2563eb]" />
              Course Preview
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight leading-tight">
              {courseRecord?.courseName ||
                "Semantic HTML5: Structure & Accessibility"}
            </h1>
            <p className="text-zinc-500 text-sm md:text-[15px] leading-relaxed max-w-xl">
              {courseRecord?.userInput ||
                "A beginner-friendly introduction covering components, JSX, props, and state."}
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs font-semibold text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Beginner
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-zinc-400" />{" "}
                {chaptersWithSlides.length} Video Chapters Live
              </span>
            </div>
          </div>

          {/* Video Preview Canvas with crisp border wrapper */}
          <div className="lg:col-span-5 w-full aspect-video rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
            {activeChapter && activeChapter.slides?.length > 0 ? (
              <Player
                key={activeChapter.chapterId}
                component={RemotionVideoEngine}
                inputProps={{ slides: activeChapter.slides }}
                durationInFrames={computedTotalFrames}
                fps={30}
                compositionWidth={1280}
                compositionHeight={720}
                style={{ width: "100%", height: "100%" }}
                controls
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 text-xs gap-2 p-4 bg-zinc-900">
                <AlertTriangle className="w-5 h-5 text-zinc-500" />
                <span>No cinematic content rendered for this block target</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Production pipeline error component */}
      {errorMessage && (
        <div className="max-w-5xl mx-auto mt-6 px-4">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-xl flex items-start gap-3 shadow-sm animate-fade-in text-left">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <span className="font-bold text-xs tracking-wider uppercase block text-rose-600">
                Pipeline Alert Status
              </span>
              <p className="text-sm font-medium mt-1 text-rose-700">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Grid Modules */}
      <main className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Tracking Engine Module */}
        <section className="lg:col-span-8 space-y-5 text-left">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">
              Chapters and Short Preview
            </h2>
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-bold">
              Active Processing Matrix
            </span>
          </div>

          <div className="space-y-4">
            {chaptersWithSlides.map((chapter: any, index: number) => {
              const isSelected = activeChapter?.chapterId === chapter.chapterId;
              return (
                <div
                  key={chapter.chapterId}
                  className={`transition-all duration-300 rounded-2xl border p-5 bg-white ${
                    isSelected
                      ? "border-[#2563eb] shadow-[0_8px_30px_rgba(37,99,235,0.04)]"
                      : "border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:border-zinc-300"
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isSelected
                              ? "bg-[#2563eb] text-white"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <h3 className="text-[15px] font-bold text-zinc-900 tracking-tight">
                          {chapter.title || chapter.chapterTitle}
                        </h3>
                      </div>

                      {chapter.summary && (
                        <p className="text-xs text-zinc-500 leading-relaxed pl-9 italic font-medium">
                          {chapter.summary}
                        </p>
                      )}

                      <ul className="space-y-1.5 pl-13 text-xs text-zinc-500 font-medium list-disc marker:text-zinc-300">
                        {chapter.subContent?.map((pt: string, idx: number) => (
                          <li key={idx} className="leading-snug">
                            {pt}
                          </li>
                        ))}
                      </ul>

                      <div className="pt-1.5 pl-9 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Video composition state verified.
                      </div>
                    </div>

                    {/* Compact Interactive Chapter Preview Window */}
                    <div
                      onClick={() => handleChapterSelect(chapter)}
                      className="w-full md:w-40 aspect-video rounded-xl overflow-hidden relative border border-zinc-200 bg-zinc-50 group cursor-pointer shrink-0 shadow-sm"
                    >
                      <div className="absolute inset-0 bg-zinc-950/5 z-10 flex flex-col items-center justify-center group-hover:bg-zinc-950/20 transition-all">
                        <div className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center group-hover:scale-105 group-hover:border-[#2563eb] transition-all shadow-sm">
                          <Play
                            className={`w-3.5 h-3.5 ml-0.5 fill-current ${
                              isSelected ? "text-[#2563eb]" : "text-zinc-600"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-widest mt-2 transition-all ${
                            isSelected
                              ? "text-[#2563eb]"
                              : "text-zinc-500 group-hover:text-zinc-700"
                          }`}
                        >
                          {isSelected ? "Now Playing" : "Click to Preview"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Side Timeline Segments Panel */}
        <aside className="lg:col-span-4 space-y-4 text-left">
          <div className="border-b border-zinc-200 pb-3">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">
              Active Layout Segments
            </h2>
          </div>

          <div className="bg-white border border-zinc-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl p-4 space-y-3">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex justify-between items-center border-b border-zinc-100 pb-2.5">
              <span>Timeline Nodes</span>
              <Badge
                variant="secondary"
                className="bg-blue-50 text-[#2563eb] border-none font-semibold text-[10px] hover:bg-blue-50"
              >
                {activeChapter?.slides?.length || 0} Slides
              </Badge>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {activeChapter?.slides?.map((slide: any) => {
                const words = slide.captions?.words || [];
                const durationSeconds =
                  words.length > 0 ? words[words.length - 1].end : 0;

                return (
                  <div
                    key={slide.slideId}
                    className="w-full p-3 rounded-xl border border-zinc-100 bg-zinc-50/50 flex items-start gap-3 transition-all hover:border-zinc-200"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]/80 mt-1.5 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-800 tracking-tight leading-tight">
                        {slide.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                        <Clock3 className="w-3 h-3 text-zinc-300" />
                        {durationSeconds
                          ? `${durationSeconds.toFixed(1)}s`
                          : "Calculating..."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
