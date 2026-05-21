// src/app/course/[courseId]/page.tsx
import React from "react";
import { db } from "@/config/db";
import { courses } from "@/config/schema";
import { eq } from "drizzle-orm";
import Header from "../../_components/Header";
import { Layers, BookOpen, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

interface CoursePreviewProps {
  params: Promise<{
    courseId: string;
  }>;
}

interface UpdatedCourseLayout {
  courseId: string;
  courseName: string;
  courseDescription: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  totalChapters: number;
  chapters: Array<{
    chapterId: string;
    chapterTitle: string;
    subContent: string[];
  }>;
}

export default async function CoursePreviewPage({
  params,
}: CoursePreviewProps) {
  const resolvedParams = await params;
  const targetId = resolvedParams.courseId;

  // Pull course mapping snapshot from Neon Postgres via Drizzle ORM
  const [courseData] = await db
    .select()
    .from(courses)
    .where(eq(courses.courseId, targetId))
    .limit(1);

  if (!courseData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-xl text-center pt-32 px-4">
          <h2 className="text-xl font-bold text-zinc-900">
            Course Configuration Not Found
          </h2>
          <p className="text-sm text-zinc-500 mt-2">
            Could not retrieve data mapped to the ID:{" "}
            <code className="bg-zinc-100 p-1 text-xs rounded">{targetId}</code>.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2563eb] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Return to landing prompt hub
          </Link>
        </div>
      </div>
    );
  }

  const layout = courseData.courseLayout as unknown as UpdatedCourseLayout;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <Header />

      {/* Premium Dark Mesh Header Banner */}
      <div className="w-full bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white pt-10 pb-24 px-4 sm:px-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Micro Breadcrumb Action Target */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Generator
          </Link>

          {/* Sparkle Header Tag Pill */}
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-200 max-w-fit shadow-inner">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Course Preview</span>
          </div>

          {/* Title rendered exactly from the AI config object payload */}
          <h1 className="text-3xl font-extrabold tracking-tight mt-4 text-white sm:text-4xl">
            {layout?.courseName || courseData.courseName}
          </h1>

          {/* Description summary string mapping */}
          <p className="text-sm leading-relaxed text-zinc-400 font-medium max-w-3xl mt-3">
            {layout?.courseDescription ||
              "No outline summary configuration provided."}
          </p>

          {/* Interactive Metric Information Metadata Groupings */}
          <div className="flex flex-wrap items-center gap-2.5 mt-6">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-semibold text-zinc-300">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>{layout?.level || "Beginner"}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-semibold text-zinc-300">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span>{layout?.chapters?.length || 0} Chapters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sheet Card Wrapper Layer: Overlaps onto dark header area elegantly */}
      <div className="mx-auto max-w-5xl px-4 -mt-14 sm:px-6 md:px-8">
        <div className="w-full bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] md:p-8">
          {/* Card Header Label Section */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
              Course preview
            </h2>
            <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">
              Chapters and Short Preview
            </span>
          </div>

          {/* Chronological Grid Stream Line */}
          <div className="space-y-4">
            {layout?.chapters?.map((chapter, index) => (
              <div
                key={chapter.chapterId || index}
                className="w-full border border-zinc-200/70 rounded-xl bg-white p-5 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between md:flex-row md:items-start"
              >
                {/* Structural Chapter Metadata Group */}
                <div className="flex flex-col flex-1">
                  {/* Headline Item Frame Row */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-[#2563eb]">
                      {index + 1}
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                      {chapter.chapterTitle}
                    </h3>
                  </div>

                  {/* Bullet Elements SubContent Mapping Arrays */}
                  {chapter.subContent && chapter.subContent.length > 0 && (
                    <ul className="mt-4 pl-10 space-y-2.5 border-l-2 border-zinc-50 ml-3.5">
                      {chapter.subContent.map((bullet, bulletIdx) => (
                        <li
                          key={bulletIdx}
                          className="flex items-start gap-2 text-xs font-medium text-zinc-500 leading-relaxed"
                        >
                          <span className="text-[#2563eb] text-sm leading-none mt-1 ">
                            •
                          </span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Right Side Action Label Component (Matches target image position exactly) */}
                <div className="mt-4 pl-10 md:mt-1.5 md:pl-0 text-right shrink-0">
                  <span className="text-xs font-bold text-zinc-900 tracking-wide bg-zinc-50 border border-zinc-200/50 rounded-lg px-3 py-1.5">
                    Player
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
