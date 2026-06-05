import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { aiEngine } from "@/config/gemini";
import { db } from "@/config/db";
import { courses } from "@/config/schema";

type CourseMode = "full" | "quick";

type Chapter = {
  chapterId: string;
  title: string;
  summary: string;
  subContent: string[];
};

type CourseLayout = {
  courseName: string;
  courseDescription: string;
  level: string;
  totalChapters: number;
  chapters: Chapter[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "course"
  );
}

function truncate(value: string, limit: number) {
  return value.length > limit ? value.slice(0, limit) : value;
}

function normalizeMode(value: unknown): CourseMode {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (
      normalized === "quick" ||
      normalized === "simple" ||
      normalized === "single"
    ) {
      return "quick";
    }
  }
  return "full";
}

function cleanJson(value: string) {
  return value
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function parseJson(value: string) {
  const cleaned = cleanJson(value);

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

function buildPrompt(promptText: string, mode: CourseMode) {
  const chapterCountHint =
    mode === "quick"
      ? "Generate exactly 1 chapter for a single-video course."
      : "Generate 3 to 5 chapters for a full course.";

  return `You are an expert AI course architect.
Return ONLY valid JSON.
Do not wrap the output in markdown or code fences.

Required output shape:
{
  "courseName": string,
  "courseDescription": string,
  "level": string,
  "totalChapters": number,
  "chapters": [
    {
      "chapterId": string,
      "title": string,
      "summary": string,
      "subContent": string[]
    }
  ]
}

Rules:
- ${chapterCountHint}
- Each chapter must have 1 to 3 short subContent points.
- Keep content practical, concise, and beginner-friendly.
- Chapter IDs should be slug-like and unique within the course.
- The course should match the user's intent and topic.

User request:
${promptText}`;
}

function normalizeLayout(
  raw: unknown,
  promptText: string,
  mode: CourseMode,
  courseSlug: string,
): CourseLayout | null {
  if (!isObject(raw)) {
    return null;
  }

  const rawChapters = Array.isArray(raw.chapters) ? raw.chapters : [];
  const chapters = rawChapters
    .map((chapter: unknown, index: number) => {
      if (!isObject(chapter)) {
        return null;
      }

      const title =
        typeof chapter.title === "string"
          ? chapter.title.trim()
          : typeof chapter.chapterTitle === "string"
            ? chapter.chapterTitle.trim()
            : "";
      const summary =
        typeof chapter.summary === "string" ? chapter.summary.trim() : "";
      const subContent = Array.isArray(chapter.subContent)
        ? chapter.subContent
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 3)
        : [];
      const chapterId =
        typeof chapter.chapterId === "string" ? chapter.chapterId.trim() : "";

      if (!title || !summary || subContent.length === 0) {
        return null;
      }

      return {
        chapterId: chapterId || `${courseSlug}-ch-${index + 1}`,
        title: truncate(title, 255),
        summary: truncate(summary, 1000),
        subContent: subContent.map((item) => truncate(item, 280)),
      };
    })
    .filter((chapter): chapter is Chapter => Boolean(chapter));

  if (chapters.length === 0) {
    return null;
  }

  const courseName =
    typeof raw.courseName === "string" && raw.courseName.trim()
      ? raw.courseName.trim()
      : promptText.slice(0, 120);
  const courseDescription =
    typeof raw.courseDescription === "string" && raw.courseDescription.trim()
      ? raw.courseDescription.trim()
      : `Auto-generated ${mode} course for ${promptText}`;
  const level =
    typeof raw.level === "string" && raw.level.trim()
      ? raw.level.trim()
      : mode === "quick"
        ? "Beginner"
        : "Intermediate";
  const totalChapters =
    typeof raw.totalChapters === "number" && Number.isFinite(raw.totalChapters)
      ? raw.totalChapters
      : chapters.length;

  return {
    courseName: truncate(courseName, 255),
    courseDescription: truncate(courseDescription, 1000),
    level: truncate(level, 50),
    totalChapters,
    chapters,
  };
}

async function tryGemini(
  promptText: string,
  mode: CourseMode,
  courseSlug: string,
): Promise<{ layout: CourseLayout | null; attempts: number; error: string }> {
  if (!aiEngine) {
    return { layout: null, attempts: 0, error: "Gemini is not configured." };
  }

  const client: any = aiEngine as any;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  let lastError = "";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: buildPrompt(promptText, mode),
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });

      const parsed = parseJson(response?.text || "");
      const layout = normalizeLayout(parsed, promptText, mode, courseSlug);
      if (layout) {
        return { layout, attempts: attempt, error: "" };
      }

      lastError = `Gemini returned invalid JSON on attempt ${attempt}.`;
    } catch (error: any) {
      lastError = error?.message || `Gemini failed on attempt ${attempt}.`;
    }
  }

  return {
    layout: null,
    attempts: 3,
    error: lastError || "Gemini failed to generate a valid layout.",
  };
}

async function tryGroq(
  promptText: string,
  mode: CourseMode,
  courseSlug: string,
) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      layout: null as CourseLayout | null,
      attempts: 0,
      error: "Groq is not configured.",
    };
  }

  // Updated to point to active non-deprecated Groq models
  const candidates = [
    process.env.GROQ_MODEL,
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
    "meta-llama/llama-4-scout-17b-16e-instruct",
  ].filter(Boolean) as string[];
  let lastError = "";

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const model = candidates[(attempt - 1) % candidates.length];

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature: 0.4,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Return only valid JSON that matches the requested schema.",
              },
              { role: "user", content: buildPrompt(promptText, mode) },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Model ${model} request failed: ${await response.text()}`,
        );
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || "";
      const parsed = parseJson(content);
      const layout = normalizeLayout(parsed, promptText, mode, courseSlug);
      if (layout) {
        return { layout, attempts: attempt, error: "" };
      }

      lastError = `Groq returned invalid JSON on attempt ${attempt} using model ${model}.`;
    } catch (error: any) {
      lastError =
        error?.message ||
        `Groq failed on attempt ${attempt} using model ${candidates[(attempt - 1) % candidates.length]}.`;
    }
  }

  return {
    layout: null as CourseLayout | null,
    attempts: 3,
    error: lastError || "Groq failed to generate a valid layout.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as any;
    const promptText =
      typeof body?.prompt === "string"
        ? body.prompt.trim()
        : typeof body?.userInput === "string"
          ? body.userInput.trim()
          : "";
    const mode = normalizeMode(body?.type);
    const providedCourseId =
      typeof body?.courseId === "string" ? body.courseId.trim() : "";
    const providedCourseName =
      typeof body?.courseName === "string" ? body.courseName.trim() : "";

    if (!promptText) {
      return NextResponse.json(
        { success: false, message: "Missing required field: prompt." },
        { status: 400 },
      );
    }

    const clerkUser = await currentUser();
    const userId =
      clerkUser?.emailAddresses[0]?.emailAddress ||
      (typeof body?.userId === "string" && body.userId.trim()
        ? body.userId.trim()
        : "guest_user_fallback@clerk.dev");
    const courseId = providedCourseId || randomUUID();
    const courseSlug = slugify(courseId);

    const geminiResult = await tryGemini(promptText, mode, courseSlug);
    const finalResult = geminiResult.layout
      ? { provider: "gemini" as const, ...geminiResult }
      : {
          provider: "groq" as const,
          ...(await tryGroq(promptText, mode, courseSlug)),
          previousError: geminiResult.error,
        };

    if (!finalResult.layout) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to generate a valid course layout after multiple attempts.",
          details:
            finalResult.error ||
            finalResult.previousError ||
            "Gemini and Groq both returned unusable results.",
        },
        { status: 502 },
      );
    }

    const courseName = truncate(
      providedCourseName || finalResult.layout.courseName,
      255,
    );
    const userInput = truncate(promptText, 1000);

    const [savedCourse] = (await db
      .insert(courses)
      .values({
        courseId,
        courseName,
        userId,
        userInput,
        type: mode,
        courseLayout: finalResult.layout,
      })
      .returning()) as any;

    return NextResponse.json(
      {
        success: true,
        message: "Course layout generated and saved successfully.",
        sourceModel: finalResult.provider,
        attempts: finalResult.attempts,
        courseId: savedCourse.courseId,
        courseLayout: savedCourse.courseLayout,
        createdAt: savedCourse.createdAt,
        course: savedCourse,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error(
      "[API courses/generate-layout] Failed to generate course layout:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate course layout.",
        details:
          error?.message ||
          "An unexpected error occurred while generating the course.",
      },
      { status: 500 },
    );
  }
}
