// src/config/gemini.ts
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable.");
}

// Initialize the modern Google Gen AI client wrapper
export const aiEngine = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
