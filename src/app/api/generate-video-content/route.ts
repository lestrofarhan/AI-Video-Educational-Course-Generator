import { NextResponse } from "next/server";
import { aiEngine } from "@/config/gemini";
import { GENERATE_VIDEO_PROMPT } from "@/data/prompt";
import { db } from "@/config/db";
import { chapterContentSlides } from "@/config/schema";
import { and, eq } from "drizzle-orm";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { courseId, courseName, chapterTitle, chapterSlug, subContent } =
      body;

    // --- STRUCTURAL INPUT VALIDATION ENGINE ---
    if (
      !courseId ||
      !courseName ||
      !chapterTitle ||
      !chapterSlug ||
      !subContent ||
      !Array.isArray(subContent)
    ) {
      return NextResponse.json(
        {
          error: "Developer Payload Mismatch",
          message:
            "Required request properties are missing or improperly typed inside your JSON body payload data structure.",
          expectedFields: {
            courseId: "string",
            courseName: "string",
            chapterTitle: "string",
            chapterSlug: "string",
            subContent: "array of strings (length 1-3)",
          },
          received: body,
        },
        { status: 400 },
      );
    }

    console.log(
      `[API Video Content] Auditing slide states for courseId: ${courseId}, chapterId: ${chapterSlug}`,
    );

    // 1. DATABASE CACHE CHECK LAYER
    const existingSlides = await db
      .select()
      .from(chapterContentSlides)
      .where(
        and(
          eq(chapterContentSlides.courseId, courseId),
          eq(chapterContentSlides.chapterId, chapterSlug),
        ),
      )
      .orderBy(chapterContentSlides.slideIndex);

    if (existingSlides.length > 0) {
      console.log(
        `[DATABASE HIT] Found ${existingSlides.length} pre-compiled slide assets.`,
      );
      return NextResponse.json(
        { source: "database", success: true, slides: existingSlides },
        { status: 200 },
      );
    }

    // 2. RUN DISTRIBUTED GENERATIVE ENGINE WITH EMERGENCY FALLBACK INTERCEPTOR
    console.log(
      `[DATABASE MISS] Running generation metrics via failover matrix vectors...`,
    );
    const inputPayload = { courseName, chapterTitle, chapterSlug, subContent };

    let rawOutputText = "";
    let systemFailureModeActive = false;

    try {
      rawOutputText = await generateContentWithFailover(inputPayload);
      if (!rawOutputText)
        throw new Error("Empty model response token layout array returned.");
    } catch (pipelineCrash) {
      console.error(
        "CRITICAL ERROR: AI clusters fully exhausted. Activating user-facing fallback preview mode...",
      );
      systemFailureModeActive = true;
    }

    let slideArray = [];

    if (systemFailureModeActive) {
      // 3. GENERATE EMERGENCY TEMPORARY PREVIEW DATA (DOES NOT COMMIT TO DATABASE)
      const mockNarration = `Sorry, our primary AI model clusters are extremely busy right now handling heavy generation traffic. Please try compiling this chapter again in a few moments. To ensure your development workspace doesn't break, here is an automated architectural layout placeholder preview for ${chapterTitle}.`;

      const wordsList = mockNarration.split(/\s+/).filter(Boolean);
      const computedDuration = Math.max(8.0, (wordsList.length * 60) / 140);
      const emergencyCaptions = generateCleanWordCaptions(
        mockNarration,
        computedDuration,
      );

      const emergencyMockSlide = {
        courseId: courseId,
        chapterId: chapterSlug,
        slideId: `${chapterSlug}-emergency-mock`,
        slideIndex: 1,
        title: "Systems Cluster Standby Node",
        subtitle: "⚠️ AI Generation Services Overloaded",
        audioFileName: "emergency-fallback.mp3",
        // Yielding an audio-less flag or baseline notification tone
        audioFileUrl: "fallback_silent_indicator",
        narration: { fullText: mockNarration },
        htmlContent: `
          <div class="w-full h-full bg-gradient-to-br from-neutral-950 via-zinc-900 to-neutral-900 flex flex-col justify-between p-16 text-white font-sans border-8 border-amber-500/20">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full uppercase">
                Cluster Maintenance Mode Active
              </span>
              <span class="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">
                System Status Code: 429 / 503
              </span>
            </div>
            
            <div class="space-y-6 my-auto max-w-4xl">
              <h2 class="text-4xl font-extrabold tracking-tight text-white leading-tight">
                ${chapterTitle}
              </h2>
              <div class="h-1 w-20 bg-amber-500 rounded-full" />
              <p class="text-lg text-zinc-300 leading-relaxed font-medium">
                Our primary models are currently fully occupied generating audio maps. The workspace layout state is preserved, and reloading will trigger another live synthesis challenge.
              </p>
            </div>

            <div class="flex items-center justify-between border-t border-zinc-800/60 pt-8">
              <div class="text-xs font-mono text-zinc-400">
                Notice: <span class="text-amber-400 font-bold">This slide session is un-saved</span> (Safe for interface reload).
              </div>
            </div>
          </div>
        `,
        revelData: ["r1"],
        captions: emergencyCaptions,
      };

      // We short-circuit here, returning the clean user notice layout WITHOUT performing a SQL write
      return NextResponse.json(
        {
          source: "emergency_fallback_preview",
          success: true,
          message:
            "Our live AI generation models are currently busy. Please try again shortly. A temporary preview layout has been loaded.",
          slides: [emergencyMockSlide],
        },
        { status: 200 },
      );
    }

    // 4. SANITIZE AND PARSE NORMAL LIVE AI RESPONSE STRINGS
    const sanitizedJsonString = rawOutputText
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/```$/, "");

    try {
      slideArray = JSON.parse(sanitizedJsonString);
    } catch (parseErr: any) {
      return NextResponse.json(
        {
          error: "JSON Compilation Error",
          message:
            "The AI engine returned an unparseable structural string response.",
          details: parseErr.message,
        },
        { status: 500 },
      );
    }

    if (
      !Array.isArray(slideArray) &&
      slideArray.slides &&
      Array.isArray(slideArray.slides)
    ) {
      slideArray = slideArray.slides;
    } else if (!Array.isArray(slideArray) && typeof slideArray === "object") {
      const firstKey = Object.keys(slideArray)[0];
      if (firstKey && Array.isArray(slideArray[firstKey])) {
        slideArray = slideArray[firstKey];
      }
    }

    if (!Array.isArray(slideArray)) {
      return NextResponse.json(
        {
          error: "Schema Normalization Error",
          message:
            "Unable to parse model token structures safely into a standard layout Array configuration.",
        },
        { status: 500 },
      );
    }

    const processedRecords = [];

    // 5. CHURN MODEL TOKENS AND SYNCHRONIZE TRACKING OVERLAYS
    for (let i = 0; i < slideArray.length; i++) {
      const slideData = slideArray[i];

      const derivedHtml =
        slideData.html || slideData.htmlContent || slideData.html_content || "";
      const rawRevealKeys = slideData.revelData ||
        slideData.revealData || ["r1", "r2", "r3"];
      const cleanRevealArray = Array.isArray(rawRevealKeys)
        ? rawRevealKeys
        : ["r1", "r2", "r3"];

      const narrationText =
        slideData.narration?.fullText ||
        slideData.narration?.text ||
        (typeof slideData.narration === "string" ? slideData.narration : "") ||
        `${slideData.title}. ${slideData.subtitle || ""}`;

      let base64AudioData = "";
      let totalSeconds = 6.0;

      try {
        console.log(
          `[TTS Engine] Streaming narration audio track for slide ${i + 1}`,
        );
        const ttsServiceUrl = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(narrationText)}`;
        const audioFetchResponse = await fetch(ttsServiceUrl);

        if (audioFetchResponse.ok) {
          const arrayBuffer = await audioFetchResponse.arrayBuffer();
          const audioBuffer = Buffer.from(arrayBuffer);
          base64AudioData = `data:audio/mp3;base64,${audioBuffer.toString("base64")}`;

          const wordsList = narrationText.split(/\s+/).filter(Boolean);
          totalSeconds = Math.max(5.0, (wordsList.length * 60) / 140);
        }
      } catch (audioException) {
        console.error("[TTS Processing Exception Warning]:", audioException);
      }

      const wordSyncCaptions = generateCleanWordCaptions(
        narrationText,
        totalSeconds,
      );

      // 6. SQL INSERTION FOR SUCCESSFUL GENERATIONS ONLY
      const [storedSlide] = await db
        .insert(chapterContentSlides)
        .values({
          courseId: courseId,
          chapterId: chapterSlug,
          slideId: slideData.slideId || `${chapterSlug}-0${i + 1}`,
          slideIndex: Number(slideData.slideIndex || i + 1),
          title: slideData.title || "Untitled Presentation Unit",
          subtitle: slideData.subtitle || "",
          audioFileName: `${slideData.slideId || chapterSlug}-0${i + 1}.mp3`,
          audioFileUrl: base64AudioData || "fallback_silent_indicator",
          narration: { fullText: narrationText },
          htmlContent: derivedHtml,
          revelData: cleanRevealArray,
          captions: wordSyncCaptions,
        })
        .returning();

      processedRecords.push(storedSlide);
    }

    return NextResponse.json(
      {
        source: "ai_generation",
        success: true,
        message: `Successfully assembled and saved ${processedRecords.length} slides to the database.`,
        slides: processedRecords,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(
      "[DEV EXCEPTION ERROR - GENERATE CONTENT POST ROUTE]:",
      error,
    );
    return NextResponse.json(
      {
        error: "Video Content Engine Exception",
        message:
          error.message ||
          "An error occurred while compiling your video motion slide array.",
        details: typeof error === "object" ? JSON.stringify(error) : error,
      },
      { status: 500 },
    );
  }
}

async function generateContentWithFailover(payload: any) {
  const promptBodyString = `Compile slides data layout matrix for target criteria: ${JSON.stringify(payload)}`;

  // Attempt 1 & 2: Hit Gemini Cluster Core
  for (let i = 0; i < 2; i++) {
    try {
      console.log(
        `[AI Engine] Dispatching generation request to Gemini (Attempt ${i + 1})...`,
      );
      const response = await aiEngine.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptBodyString,
        config: {
          systemInstruction: GENERATE_VIDEO_PROMPT,
          responseMimeType: "application/json",
        },
      });
      if (response?.text) return response.text;
    } catch (error: any) {
      console.warn(
        `Gemini Attempt ${i + 1} encountered an exception loop structure.`,
      );
      if (i === 1)
        console.warn(
          "[AI Engine] Gemini Core full. Escalating immediately to Groq Cluster...",
        );
      else await new Promise((res) => setTimeout(res, 1000));
    }
  }

  // Attempt 3: Failover Strategy execution straight into Groq (Llama-3.3-70b)
  console.log(
    `[AI Engine] Executing emergency bypass request via Groq pipeline...`,
  );
  const groqSystemPrompt = `${GENERATE_VIDEO_PROMPT}\nCRITICAL REQUIREMENT: Return your layout array nested inside a root object containing a single "slides" array property key matching this layout pattern: { "slides": [ ... ] }`;

  const groqResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: groqSystemPrompt },
      { role: "user", content: promptBodyString },
    ],
    response_format: { type: "json_object" },
  });

  return groqResponse.choices[0]?.message?.content || "";
}

function generateCleanWordCaptions(
  fullText: string,
  totalDurationSeconds: number,
) {
  if (!fullText) return [];
  const cleanWords = fullText
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (cleanWords.length === 0) return [];

  const timePerWord = totalDurationSeconds / cleanWords.length;
  let timeTracker = 0.0;

  return cleanWords.map((word) => {
    const start = timeTracker;
    const end = start + timePerWord;
    timeTracker = end;

    return {
      text: word,
      start: parseFloat(start.toFixed(2)),
      end: parseFloat(end.toFixed(2)),
    };
  });
}
