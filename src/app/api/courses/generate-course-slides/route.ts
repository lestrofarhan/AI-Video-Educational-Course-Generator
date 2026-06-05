import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Groq, { toFile } from "groq-sdk";
import { db } from "@/config/db";
import { chapterContentSlides } from "@/config/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_VISUAL_PROMPT = `
You are an elite Motion Graphics Designer and Frontend Engineer specializing in creating world-class, highly engaging educational video slides for Remotion.
Your task is to take a course chapter and generate a minimum of 5 to 6 highly distinct, beautiful slides for that specific chapter.

CRITICAL ENGAGEMENT & DURATION RULES:
1. TARGET DURATION: The total narrative length for this chapter must exceed 2 minutes when spoken. 
2. For EACH individual slide, write an extensive, deeply descriptive, and comprehensive 'narrationText' paragraph (minimum 150-200 words). Do not summarize. Explain concepts thoroughly with smooth, human-like verbal transitions.
3. DO NOT just dump text sentences on a plain background. Slides must look professional, modern, and cinematic (Quiet Luxury aesthetic).
4. Use a sophisticated color palette: Deep dark mode background (#0a0a0c), dark charcoal cards (#121214), with striking accents (e.g., electric blue, vivid purple, or minimalist emerald text/borders).
5. Layout Variety is required across the slide array: 
   - Slide 1: High-impact Title Slide (bold typography, minimalist container card).
   - Slide 2: Modern Two-Column Layout (Left side: a clean code snippet or conceptual visual container; Right side: broken down reveal bullet points).
   - Slide 3: Status Grid or Process flow (3 separate columns or cards lined up next to each other horizontally).
   - Slide 4 & 5: Complex technical deep-dives or comparison matrices.
6. Every piece of narrative text meant to animate into view sequentially MUST be wrapped in an HTML element containing a 'reveal' class and a distinct 'data-reveal' token value (e.g., "r1", "r2", "r3").
7. The 'htmlContent' must be fully standalone 1280x720 video frames using the Tailwind CSS CDN script. Do not include raw markdown outside the string.

You must return your response strictly as a JSON object matching this TypeScript structure:
{
  "slides": [
    {
      "slideIndex": number,
      "title": "String (Impactful, short)",
      "subtitle": "String (Optional context line)",
      "narrationText": "String (The exhaustive voiceover paragraph corresponding to this slide's visuals, min 150 words)",
      "revelData": ["r1", "r2", "r3"],
      "htmlContent": "Entire self-contained valid 1280x720 HTML string including tailwind script tag"
    }
  ]
}
`;

function chunkText(text: string, maxLength = 150): string[] {
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

  const audioBufferPromises = textChunks.map(async (chunk) => {
    const encodedText = encodeURIComponent(chunk);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodedText}`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) throw new Error(`TTS Chunk fetch failed: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  });

  const chunkBuffers = await Promise.all(audioBufferPromises);
  return Buffer.concat(chunkBuffers);
}

// Whisper Transcription Engine tracking exact sub-word timestamps
async function generateWhisperCaptions(audioBuffer: Buffer) {
  try {
    const audioFile = await toFile(audioBuffer, "narration.mp3", {
      type: "audio/mp3",
    });

    // FIXED: Explicitly asking Groq for granular word level tracking arrays
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
      temperature: 0.0,
    });

    if (transcription.words && Array.isArray(transcription.words)) {
      return {
        words: transcription.words.map((w: any) => ({
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
    console.error("Whisper alignment sequence caught an exception:", err);
    return {
      words: [{ start: 0, end: 1, word: "Captions Unavailable" }],
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
    Course Name: ${courseName}
    Chapter Title: ${chapterTitle}
    Core Topics to cover comprehensively: ${JSON.stringify(subContent)}
    
    Generate at least 5 to 6 sequential, highly detailed premium video slides following this topic scope. Ensure massive narration length. Return valid JSON only.
  `;

  if (attempt <= 2) {
    const modelName = attempt === 1 ? "gemini-2.5-flash" : "gemini-2.5-pro";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPromptText,
      config: {
        systemInstruction: SYSTEM_VISUAL_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("Gemini returned an empty body frame.");
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
      temperature: 0.2,
    });

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText)
      throw new Error("Groq engine returned an empty response string.");
    return JSON.parse(responseText);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseId, courseName, chapter } = body;

    if (!courseId || !chapter || !chapter.chapterId) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters." },
        { status: 400 },
      );
    }

    let generatedData = null;
    let errorsLog: string[] = [];
    const MAX_ATTEMPTS = 4;

    const targetChapterTitle =
      chapter.chapterTitle || chapter.title || "Untitled Segment";

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
          `Attempt ${attempt} Failed: ${err?.message || "Unknown error"}`,
        );
      }
    }

    if (!generatedData || !Array.isArray(generatedData.slides)) {
      return NextResponse.json(
        {
          success: false,
          message: "Model Busy Exception: Generation microservices exhausted.",
          details: errorsLog,
        },
        { status: 503 },
      );
    }

    const finalizedSlidesPayload = await Promise.all(
      generatedData.slides.map(async (slide: any, index: number) => {
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
            `Audio/Caption pipeline execution failed for slide ${index + 1}:`,
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

        return dbRecord;
      }),
    );

    return NextResponse.json({
      success: true,
      message:
        "Exhaustive slides generated, processed with Whisper, and saved directly to Neon DB.",
      chapterId: chapter.chapterId,
      totalSlides: finalizedSlidesPayload.length,
      slides: finalizedSlidesPayload,
    });
  } catch (error: any) {
    console.error("Critical failure during transaction handling:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server route error.",
      },
      { status: 500 },
    );
  }
}
