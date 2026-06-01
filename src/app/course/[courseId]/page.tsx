"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Player } from "@remotion/player";
import { CourseComposition } from "@/app/_components/CourseComposition";
import {
  Loader2,
  AlertCircle,
  Play,
  ArrowLeft,
  Video,
  BookOpen,
  HelpCircle,
  Film,
  CheckCircle2,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

interface Chapter {
  chapterId: string;
  title: string;
  summary: string;
  subContent: string[];
  isRendered: boolean;
  videoUrl: string | null;
  htmlContent?: string;
  subtitle?: string;
  captions?: CaptionWord[];
  durationSeconds?: number;
}

export default function CourseWorkspacePage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryPrompt = searchParams.get("prompt");
  const queryLevel = searchParams.get("level");

  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [pipelineAlert, setPipelineAlert] = useState("");
  const [courseMeta, setCourseMeta] = useState<any>(null);
  const [chaptersList, setChaptersList] = useState<Chapter[]>([]);
  const [activeProcessingChapter, setActiveProcessingChapter] = useState<string | null>(null);
  const [activeChapterData, setActiveChapterData] = useState<Chapter | null>(null);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        // Safe query string separation to prevent route matching collisions
        const queryParams = new URLSearchParams({ courseId: courseId });
        const response = await fetch(`/api/courses/get-details?${queryParams.toString()}`);
        const data = await response.json();

        if (response.ok && data.exists) {
          setCourseMeta(data.course);

          const processedChapters = (data.course.courseLayout?.chapters || []).map((chap: any) => {
            const matchingSlides = data.slides?.filter((s: any) => s.chapterId === chap.chapterId) || [];
            const primarySlide = matchingSlides[0]; 

            let calculatedDuration = 6.0;
            if (primarySlide?.captions && Array.isArray(primarySlide.captions) && primarySlide.captions.length > 0) {
              calculatedDuration = primarySlide.captions[primarySlide.captions.length - 1].end + 0.8;
            }

            return {
              ...chap,
              isRendered: !!primarySlide,
              videoUrl: primarySlide ? primarySlide.audioFileUrl : null,
              htmlContent: primarySlide ? primarySlide.htmlContent : "",
              subtitle: primarySlide ? primarySlide.subtitle : "Automated Architecture Engine",
              captions: primarySlide ? primarySlide.captions : [],
              durationSeconds: calculatedDuration,
            };
          });

          setChaptersList(processedChapters);

          const firstRendered = processedChapters.find((c: any) => c.isRendered);
          if (firstRendered) setActiveChapterData(firstRendered);

          setStatus("ready");
          return;
        }

        if (queryPrompt) {
          const initResponse = await fetch("/api/courses/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseName: "Generating Structural Layout Blueprint...",
              userInput: queryPrompt,
              level: queryLevel,
            }),
          });

          const initData = await initResponse.json();
          if (!initResponse.ok) {
            setPipelineAlert(initData.message || "Failed to initialize standard blueprint layout components.");
            setStatus("failed");
            return;
          }

          router.replace(`/course/${initData.courseId}`);
        } else {
          setPipelineAlert("The specified course metadata key reference could not be verified inside our records.");
          setStatus("failed");
        }
      } catch (err: any) {
        setStatus("failed");
        setPipelineAlert("An unhandled exception occurred during canvas synchronization routines.");
      }
    }

    if (courseId) loadWorkspace();
  }, [courseId, queryPrompt, queryLevel, router]);

  const compileChapterAssets = async (chapterId: string, currentChapterObj: Chapter) => {
    setActiveProcessingChapter(chapterId);
    setPipelineAlert(""); 
    
    // Fallback logic to protect the pipeline if document states are contextually blank
    const fallBackCourseName = courseMeta?.courseName || document.querySelector("h1")?.innerText || "Semantic HTML5: Structure & Accessibility";

    try {
      const response = await fetch("/api/generate-video-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: courseId,
          courseName: fallBackCourseName,
          chapterTitle: currentChapterObj.title,
          chapterSlug: chapterId,
          subContent: currentChapterObj.subContent || ["Introduction Overview Matrix"],
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || resData.error || "Upstream production generation failed.");
      }

      const targetedSlide = Array.isArray(resData.slides) ? resData.slides[0] : null;

      if (!targetedSlide) {
        throw new Error("Pipeline successfully generated resources, but could not read the returning slide array.");
      }

      const verifiedAudioPath = targetedSlide.audioFileUrl;
      const verifiedHtml = targetedSlide.htmlContent || "<div>No HTML Content Layer Found</div>";
      const verifiedCaptions = targetedSlide.captions || [];
      
      let calculatedDuration = 6.0;
      if (verifiedCaptions.length > 0) {
        calculatedDuration = verifiedCaptions[verifiedCaptions.length - 1].end + 0.8;
      }

      const updatedFields = {
        isRendered: true,
        videoUrl: verifiedAudioPath,
        htmlContent: verifiedHtml,
        subtitle: targetedSlide.subtitle || "Production Generation Node Verified",
        captions: verifiedCaptions,
        durationSeconds: calculatedDuration,
      };

      setChaptersList((prev) =>
        prev.map((c) => (c.chapterId === chapterId ? { ...c, ...updatedFields } : c))
      );

      setActiveChapterData({
        ...currentChapterObj,
        ...updatedFields,
      });

    } catch (err: any) {
      setPipelineAlert(`Pipeline Exception Triggered: ${err.message}`);
    } finally {
      setActiveProcessingChapter(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
          Loading Studio Core Workspace Canvas...
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-slate-200 shadow-xl bg-white rounded-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <CardTitle className="text-lg font-bold tracking-tight">Workspace Error Exception</CardTitle>
            </div>
            <CardDescription className="text-xs leading-relaxed text-slate-500">
              {pipelineAlert}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end border-t border-slate-100 pt-4 bg-slate-50/50 rounded-b-2xl">
            <Button variant="outline" size="sm" onClick={() => router.push("/")} className="text-xs font-semibold">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 pb-20 antialiased font-sans select-none">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-slate-500 hover:text-slate-900 text-xs font-bold gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Studio
          </Button>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-extrabold">
              Remotion Studio Thread Connected
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
        {pipelineAlert && (
          <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-900 rounded-xl shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <AlertTitle className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
              Active Warning Block
            </AlertTitle>
            <AlertDescription className="text-xs font-medium mt-0.5 font-mono">
              {pipelineAlert}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-0.5">
            Interactive Video Studio Course
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            {courseMeta?.courseName || "Semantic HTML5: Structure & Accessibility"}
          </h1>
        </div>

        <Separator className="bg-slate-200/60 my-2" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left panel layout */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Curriculum Blueprint Modules
            </h3>

            <div className="space-y-3">
              {chaptersList.map((chapter, index) => {
                const isSelectedChapter = activeChapterData?.chapterId === chapter.chapterId;
                return (
                  <Card
                    key={chapter.chapterId}
                    className={`transition-all bg-white border-slate-200 rounded-xl overflow-hidden shadow-sm ${
                      chapter.isRendered 
                        ? "border-indigo-200 bg-gradient-to-r from-white to-indigo-50/[0.12]" 
                        : "hover:border-slate-300"
                    } ${isSelectedChapter ? "ring-2 ring-indigo-500 border-indigo-300 shadow-md" : ""}`}
                  >
                    <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${
                            chapter.isRendered ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            0{index + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                            {chapter.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 pl-7 leading-relaxed">
                          {chapter.summary}
                        </p>
                        
                        {chapter.subContent && (
                          <ul className="text-[11px] text-slate-400 font-semibold pl-7 pt-1.5 space-y-0.5 list-disc list-inside">
                            {chapter.subContent.map((subText, sIdx) => (
                              <li key={sIdx}>{subText}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="w-full sm:w-auto shrink-0 pl-7 sm:pl-0">
                        {chapter.isRendered ? (
                          <Button
                            onClick={() => setActiveChapterData(chapter)}
                            variant={isSelectedChapter ? "default" : "outline"}
                            size="sm"
                            className={`text-xs font-bold h-8 px-3.5 rounded-lg shadow-sm ${
                              isSelectedChapter 
                                ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                                : "text-slate-600 bg-white border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <Play className="w-3 h-3 mr-1.5 fill-current" /> Preview Track
                          </Button>
                        ) : (
                          <Button
                            disabled={activeProcessingChapter === chapter.chapterId}
                            onClick={() => compileChapterAssets(chapter.chapterId, chapter)}
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold border-dashed border-slate-300 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/30 h-8 px-3.5 rounded-lg transition-all"
                          >
                            {activeProcessingChapter === chapter.chapterId ? (
                              <>
                                <Loader2 className="w-3 h-3 text-indigo-600 animate-spin mr-1.5" />
                                <span className="text-slate-400 font-bold animate-pulse">Compiling Track...</span>
                              </>
                            ) : (
                              <>Synthesize Assets</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {chapter.isRendered && (
                      <div className="bg-indigo-50/40 border-t border-indigo-100/40 px-5 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 tracking-wide">
                        <CheckCircle2 className="w-3 h-3" /> Core production media cache loaded safely.
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Video Player monitoring column */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <Card className="border-slate-200 shadow-xl bg-white rounded-2xl overflow-hidden border">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Remotion Production Monitor Node
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="w-full aspect-video bg-slate-950 rounded-xl flex flex-col items-center justify-center relative overflow-hidden border border-slate-900 shadow-inner">
                  {activeChapterData?.videoUrl ? (
                    <div className="w-full h-full relative remotion-player-custom-wrapper">
                      <Player
                        key={activeChapterData.chapterId} 
                        component={CourseComposition}
                        inputProps={{
                          title: activeChapterData.title,
                          subtitle: activeChapterData.subtitle || "Automated System Blueprint",
                          htmlContent: activeChapterData.htmlContent || "<div>No Workspace Document Parsed</div>",
                          audioFileUrl: activeChapterData.videoUrl,
                          captions: activeChapterData.captions || [],
                        }}
                        durationInFrames={Math.ceil(30 * (activeChapterData.durationSeconds || 6.0))}
                        fps={30}
                        compositionWidth={1280}
                        compositionHeight={720}
                        style={{ width: "100%", height: "100%" }}
                        controls
                        autoPlay
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-2 p-6">
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 mx-auto text-slate-600">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-400">Player Stream Standby</h4>
                        <p className="text-[10px] text-slate-500 max-w-[210px] mx-auto leading-normal">
                          Synthesize or open a compiled chapter card on the left panel to execute streaming rendering.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex gap-3 items-start">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-700">Dynamic Synchronization Engine:</h5>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      The active monitoring timeline automatically scales length boundaries based on voice data streams to eliminate sudden frame cutoffs.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}