import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Groq, { toFile } from "groq-sdk";
import { db } from "@/config/db";
import { chapterContentSlides } from "@/config/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_VISUAL_PROMPT = `
You are a World-Class Principal Motion Graphics Designer and Elite Frontend Engineer who creates high-retention, cinematic video courses. Your content outperforms custom Premiere Pro and After Effects timelines. Your design system relies on clean premium dark themes, dramatic typography scaling, and high-end fluid layout transitions.

You are generating production-ready HTML canvas layers for a 1280x720 video layout rendered via Remotion.

---
### 1. KINETIC PRESENTATION & VIEWPALETTE RULES (CRITICAL)
* **Canvas Framework:** Every slide MUST be completely enclosed inside a full-bleed viewport wrapper centered on both axes: \`<div class="w-[1280px] h-[720px] bg-[#050508] text-white flex flex-col items-center justify-center p-16 relative overflow-hidden font-sans select-none">\`. 
* **Color Spec:** Base background is obsidian (\`#050508\`). Structural cards must use deep charcoal glassmorphism (\`bg-[#0c0c10]/70 backdrop-blur-xl border border-zinc-800/40\`). Accents must use clean glowing variants: Electric Cyan (\`#06b6d4\`), Hyper-Violet (\`#8b5cf6\`), and Premium Emerald (\`#10b981\`).
* **Typography Scaling:** Headings must be massive, authoritative, and tight (\`text-5xl lg:text-6xl font-black tracking-tighter leading-none\`). Text blocks or bullet titles should use modern high-contrast styling (\`tracking-wide uppercase text-xs font-bold text-zinc-400\`).

---
### 2. TIMELINE ANIMATIONS & MOTION CURVES
* Every layout element must gracefully reveal itself on screen. Statically placed text blocks are completely forbidden.
* Map element groups directly to the sequence identifiers provided in your 'revelData' parameter (e.g., ["r1", "r2", "r3"]) by injecting progressive, arbitrary animation delay styles into the markup:
  - Element 1 (\`r1\`): \`class="opacity-0 [animation-name:cinematicReveal] duration-700 [animation-fill-mode:forwards] ease-[cubic-bezier(0.16,1,0.3,1)]"\`
  - Element 2 (\`r2\`): \`class="opacity-0 [animation-name:cinematicReveal] duration-700 [animation-fill-mode:forwards] ease-[cubic-bezier(0.16,1,0.3,1)] [animation-delay:1000ms]"\`
  - Element 3 (\`r3\`): \`class="opacity-0 [animation-name:cinematicReveal] duration-700 [animation-fill-mode:forwards] ease-[cubic-bezier(0.16,1,0.3,1)] [animation-delay:2000ms]"\`
* Define these exact motion matrices cleanly within a \`<style>\` tag inside your HTML payload string:
  \`\`\`css
  @keyframes cinematicReveal {
    from { opacity: 0; transform: translateY(32px) scale(0.97); filter: blur(8px); }
    to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes gradientPan {
    0% { bg-position: 0% 50%; }
    50% { bg-position: 100% 50%; }
    100% { bg-position: 0% 50%; }
  }
  \`\`\`

---
### 3. COMPOSITION SCHEMAS (MANDATORY VARIETY)
Do not repeat layouts. Build a varying visual progression across your 5 to 6 slide set:
1. **Slide 1: High-Impact Title Blueprint:** Dominated by a massive centered title with a split-gradient text layout (\`bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent\`), a clean horizontal hairline decorative divider, and a floating metadata label tracking the current module topic scope.
2. **Slide 2: System Architecture Split:** A clean 2-column layout. Left column holds a highly stylized code-snippet viewport window or flowchart entity card containing structured content. Right column holds two sequential deep-dive reveal cards (\`r1\`, \`r2\`) offset vertically with clean padding layouts.
3. **Slide 3: Horizontal Timeline Chain:** 3 distinct cards or workflow nodes arranged edge-to-edge horizontally across the central canvas belt. Each card animates into view step-by-step using ordered timeline offsets (\`r1\` at 0ms, \`r2\` at 1000ms, \`r3\` at 2000ms).
4. **Slide 4: The Massive Focal Callout:** Built around a giant central terminal graphic element or hyper-bold core phrase metric (e.g., "99.9% Core Accessibility Score") designed to snap visual focus directly to the core concept.
5. **Slide 5 & 6: Production Vs Misconception Grid:** A highly sophisticated tabular comparison grid matrix separating standard myths from engineering realities, utilizing contrasting accent colors (vibrant red-orange vs sleek cyber emerald).

---
### 4. PRESENTATION VOICE SCRIPT
* The 'narrationText' attribute must contain an exhaustive, deeply educational verbal script (minimum 150-200 words per slide). Avoid quick summaries or bullet-point reading templates. Write exactly how a senior technical architect presents content live on stage—incorporating detailed analogies and smooth transitional phrase frameworks.

---
### RESPOND STRICTLY WITH VALID JSON
Ensure the returned string is perfectly parsed JSON conforming to this schema blueprint:
{
  "slides": [
    {
      "slideIndex": number,
      "title": "String (Impactful graphic headline)",
      "subtitle": "String (Uppercase module context tag)",
      "narrationText": "String (Exhaustive, highly engaging voiceover paragraph explaining the concepts shown in this slide. Minimum 150-200 words.)",
      "revelData": ["r1", "r2", "r3"],
      "htmlContent": "String (Complete valid 1280x720 responsive layout string containing the standard Tailwind CDN script link, custom keyframe animation blocks, and granular delay mappings)."
    }
  ]
}
`;

function chunkText(text: string, maxLength = 140): string[] {
  const words = text.replace(/\n/g, " ").split(" ");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const word of words) {
    if ((currentChunk + " " + word).trim().length <= maxLength) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = word;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

async function generateAudioBuffer(text: string): Promise<Buffer> {
  const textChunks = chunkText(text);
  const chunkBuffers: Buffer[] = [];

  // Sequential generation completely decouples buffer context streams to bypass rate-limiting overlap errors
  for (const chunk of textChunks) {
    const encodedText = encodeURIComponent(chunk);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok)
      throw new Error(
        `Google Audio Pipeline returned response code: ${res.status}`,
      );
    const arrayBuffer = await res.arrayBuffer();
    chunkBuffers.push(Buffer.from(arrayBuffer));
  }

  return Buffer.concat(chunkBuffers);
}

async function generateWhisperCaptions(audioBuffer: Buffer) {
  try {
    const audioFile = await toFile(audioBuffer, "narration.mp3", {
      type: "audio/mp3",
    });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
      temperature: 0.0,
    });


   

    // Typecast to 'any' or 'OpenAI.Audio.TranscriptionVerbose' to clear the TS error
    const transcriptionData = transcription as any;

    if (transcriptionData.words && Array.isArray(transcriptionData.words)) {
      return {
        words: transcriptionData.words.map((w: any) => ({
          word: w.word.trim(),
          start: w.start,
          end: w.end,
        })),
      };
    }

    return {
      words: [{ start: 0, end: 5, word: transcription.text || "" }],
    };
  } catch (err) {
    console.error(
      "Whisper caption compiler encountered an exception layout:",
      err,
    );
    return {
      words: [{ start: 0, end: 1, word: "Captions Unresolved" }],
    };
  }
}

async function attemptLLMGeneration(
  courseName: string,
  chapterTitle: string,
  subContent: string[],
  attempt: number,
): Promise<any> {
  const userPromptText = `
    Course Scope: ${courseName}
    Target Module Topic: ${chapterTitle}
    Curriculum Focus Parameters: ${JSON.stringify(subContent)}
    
    Synthesize exactly 5 to 6 completely unique cinematic slides matching our required multi-sentence presentation scripts. Return valid, parseable JSON only.
  `;

  if (attempt <= 2) {
    const modelName = attempt === 1 ? "gemini-2.5-flash" : "gemini-2.5-pro";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPromptText,
      config: {
        systemInstruction: SYSTEM_VISUAL_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText)
      throw new Error(
        "Generative layer returned an empty output layout frame.",
      );
    return JSON.parse(responseText);
  } else {
    const modelName =
      attempt === 3 ? "llama-3.3-70b-versatile" : "mixtral-8x7b-32768";
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_VISUAL_PROMPT },
        { role: "user", content: userPromptText },
      ],
      model: modelName,
      response_format: { type: "json_object" },
      temperature: 0.15,
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText)
      throw new Error(
        "Groq API transaction layout block returned an unreadable response string.",
      );
    return JSON.parse(responseText);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseId, courseName, chapter } = body;

    if (!courseId || !chapter || !chapter.chapterId) {
      return NextResponse.json(
        { success: false, message: "Missing required tracking properties." },
        { status: 400 },
      );
    }

    let generatedData = null;
    let errorsLog: string[] = [];
    const MAX_ATTEMPTS = 4;
    const targetChapterTitle =
      chapter.chapterTitle ||
      chapter.title ||
      "Untitled Cinematic Component Node";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        generatedData = await attemptLLMGeneration(
          courseName,
          targetChapterTitle,
          chapter.subContent || [],
          attempt,
        );
        if (generatedData && Array.isArray(generatedData.slides)) break;
      } catch (err: any) {
        errorsLog.push(
          `Synthesis System Attempt [${attempt}] Faulted: ${err?.message || "JSON parsing discrepancy"}`,
        );
      }
    }

    if (!generatedData || !Array.isArray(generatedData.slides)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All secondary generative engine fallbacks failed to process content models cleanly.",
          details: errorsLog,
        },
        { status: 503 },
      );
    }

    const finalizedSlidesPayload = [];

    // Processing each slide sequentially isolates each specific asset pipeline configuration
    for (let index = 0; index < generatedData.slides.length; index++) {
      const slide = generatedData.slides[index];
      const formattedSlideId = `${chapter.chapterId}-${String(index + 1).padStart(2, "0")}`;

      let audioDataUri = null;
      let structuredCaptions = { words: [] };

      try {
        const compilationAudioBuffer = await generateAudioBuffer(
          slide.narrationText,
        );
        structuredCaptions = await generateWhisperCaptions(
          compilationAudioBuffer,
        );
        audioDataUri = `data:audio/mp3;base64,${compilationAudioBuffer.toString("base64")}`;
      } catch (audioPipelineError) {
        console.error(
          `Isolated audio execution break at slide index [${index + 1}]:`,
          audioPipelineError,
        );
      }

      const dbRecord = {
        courseId: String(courseId),
        chapterId: String(chapter.chapterId),
        slideId: formattedSlideId,
        slideIndex: index + 1,
        title: slide.title,
        subtitle: slide.subtitle || null,
        audioFileName: `${formattedSlideId}.mp3`,
        audioFileUrl: audioDataUri,
        narration: { fullText: slide.narrationText },
        htmlContent: slide.htmlContent,
        revelData: slide.revelData || [],
        captions: structuredCaptions,
      };

      await db
        .insert(chapterContentSlides)
        .values(dbRecord)
        .onConflictDoUpdate({
          target: chapterContentSlides.slideId,
          set: dbRecord,
        });

      finalizedSlidesPayload.push(dbRecord);
    }

    return NextResponse.json({
      success: true,
      message:
        "Exhaustive cinematic video slides compiled and cataloged cleanly inside Neon DB database maps.",
      chapterId: chapter.chapterId,
      totalSlides: finalizedSlidesPayload.length,
      slides: finalizedSlidesPayload,
    });
  } catch (error: any) {
    console.error(
      "Critical routing transaction engine execution break:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message || "Internal transaction routing breakdown exception.",
      },
      { status: 500 },
    );
  }
}
