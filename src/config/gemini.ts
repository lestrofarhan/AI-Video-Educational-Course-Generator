// src/config/gemini.ts
import { GoogleGenAI } from "@google/genai";

export const aiEngine = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export function getGeminiClient() {
  return aiEngine;
}

export function hasGeminiClient() {
  return Boolean(aiEngine);
}
