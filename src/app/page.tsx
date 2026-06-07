"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/app/_components/Header";
import { PROMPT_SUGGESTIONS } from "@/data/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SendHorizontal,
  Loader2,
  BookOpen,
  Clock3,
  Layers3,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserCourse {
  id: number;
  courseId: string;
  courseName: string;
  userInput: string;
  type: string;
  createdAt: string;
  chapterCount: number;
}

export default function LandingPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [courseType, setCourseType] = useState<string>("full");
  const [loading, setLoading] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const router = useRouter();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();

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
    setGenerationError(null);

    try {
      const response = await fetch("/api/courses/generate-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prompt: prompt.trim(),
          type: courseType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.message || "Failed to generate course layout.");
      }

      router.push(`/course/${data.courseId}`);
    } catch (error: any) {
      setGenerationError(error?.message || "Failed to generate course layout.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoaded) return;

    if (!isSignedIn) {
      setUserCourses([]);
      setCoursesError(null);
      setCoursesLoading(false);
      return;
    }

    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    if (!email) {
      setCoursesError("No primary email is available for this account.");
      setUserCourses([]);
      return;
    }

    const controller = new AbortController();

    async function loadCourses() {
      try {
        setCoursesLoading(true);
        setCoursesError(null);

        console.log("Fetching courses for email:", email);
        const response = await fetch(
          `/api/user-courses?email=${encodeURIComponent(email)}`,
          {
            signal: controller.signal,
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        console.log("response", response);
        const data = await response.json();
        console.log(data)
        if (!response.ok) {
          throw new Error(data.message || "Failed to load your courses.");
        }

        setUserCourses(data.courses || []);
        console.log("Loaded user courses:", data.courses || []);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        setCoursesError( error.message || "Failed to load your courses.");
        setUserCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    }

    loadCourses();

    return () => controller.abort();
  }, [isSignedIn, isUserLoaded, user?.primaryEmailAddress?.emailAddress]);

  const signedInEmail = useMemo(
    () => user?.primaryEmailAddress?.emailAddress || "",
    [user?.primaryEmailAddress?.emailAddress],
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Header />

      <main className="mx-auto flex max-w-4xl flex-col items-center justify-center px-4 pt-12 pb-16 text-center md:px-6 md:pt-24">
        <div className="space-y-3 px-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-[44px] leading-tight">
            Learn Smarter with{" "}
            <span className="text-[#2563eb]">AI Video Courses</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 sm:text-base md:text-[17px]">
            Turn Any Topic into a Complete Course
          </p>
        </div>

        <div className="mt-8 w-full max-w-2xl rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus-within:border-zinc-300 transition-all text-left">
          <textarea
            disabled={loading}
            placeholder="What do you want to learn today?..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full min-h-22.5 md:min-h-27.5 bg-transparent p-2 text-[15px] text-zinc-800 placeholder-zinc-400 outline-none resize-none disabled:opacity-50"
          />

          <div className="flex flex-col gap-3 pt-2 border-t border-zinc-100 px-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            <div className="w-full sm:w-40">
              <Select
                disabled={loading}
                value={courseType}
                onValueChange={setCourseType}
              >
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

            <button
              disabled={loading || !prompt.trim()}
              onClick={handleGenerate}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1a73e8] text-white transition-all hover:bg-[#155cb4] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm sm:h-9 sm:w-9 sm:gap-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span className="text-xs font-semibold sm:hidden">
                    Generate Layout
                  </span>
                  <SendHorizontal className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {generationError && (
            <p className="px-1 pt-2 text-xs font-medium text-rose-600">
              {generationError}
            </p>
          )}
        </div>

        <div className="mt-7 w-full max-w-2xl px-1">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PROMPT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.id}
                disabled={loading}
                onClick={() =>
                  handleSuggestionClick(suggestion.prompt, suggestion.type)
                }
                className="cursor-pointer text-[11px] md:text-xs rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 flex items-center gap-1 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>

        <section className="mt-14 w-full max-w-6xl px-1 text-left">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 shadow-sm">
                <BookOpen className="h-3.5 w-3.5 text-[#2563eb]" />
                Your courses
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
                Continue from where you left off
              </h2>
              <p className="max-w-2xl text-sm text-zinc-500 sm:text-[15px]">
                Recent courses generated for
                {signedInEmail ? ` ${signedInEmail}` : " your account"}.
              </p>
            </div>

            {isSignedIn ? (
              <Badge
                variant="outline"
                className="w-fit border-zinc-200 bg-white px-3 py-1 text-zinc-600"
              >
                {coursesLoading ? "Refreshing" : `${userCourses.length} saved`}
              </Badge>
            ) : null}
          </div>

          {!isSignedIn ? (
            <Card className="border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <CardContent className="flex flex-col items-start gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold text-zinc-900">
                    Sign in to see your generated courses
                  </CardTitle>
                  <CardDescription className="text-sm text-zinc-500">
                    Your course library is tied to your email so each account
                    keeps its own history.
                  </CardDescription>
                </div>
                <Button
                  asChild
                  className="bg-[#1a73e8] text-white hover:bg-[#155cb4]"
                >
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </CardContent>
            </Card>
          ) : coursesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={index}
                  className="min-h-45 border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                  <CardContent className="space-y-4 px-6 py-6">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-100" />
                    <div className="h-6 w-full animate-pulse rounded-lg bg-zinc-100" />
                    <div className="h-4 w-2/3 animate-pulse rounded-full bg-zinc-100" />
                    <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-100" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : coursesError ? (
            <Card className="border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <CardContent className="px-6 py-8">
                <CardTitle className="text-base font-bold text-zinc-900">
                  Could not load your courses
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-zinc-500">
                      {coursesError}
                </CardDescription>
              </CardContent>
            </Card>
          ) : userCourses.length === 0 ? (
            <Card className="border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <CardContent className="flex flex-col items-start gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold text-zinc-900">
                    No courses yet
                  </CardTitle>
                  <CardDescription className="text-sm text-zinc-500">
                    Generate your first course above and it will appear here
                    automatically.
                  </CardDescription>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-500">
                  <Layers3 className="h-3.5 w-3.5 text-[#2563eb]" />
                  Ready when you are
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {userCourses.map((course) => (
                <Card
                  key={course.courseId}
                  className="group border-zinc-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgb(0,0,0,0.08)]"
                >
                  <CardHeader className="space-y-3 border-b border-zinc-100 px-6 pb-4 pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <Badge
                        variant="outline"
                        className="border-zinc-200 bg-zinc-50 text-zinc-600"
                      >
                        {course.type === "quick"
                          ? "Quick explainer"
                          : "Full course"}
                      </Badge>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(course.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold tracking-tight text-zinc-900">
                      {course.courseName}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm text-zinc-500">
                      {course.userInput}
                    </CardDescription>
                  </CardHeader>

                 

                  <CardFooter className="border-t border-zinc-100 px-6 py-4">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-between border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                    >
                      <Link href={`/course/${course.courseId}`}>
                        Open course
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
