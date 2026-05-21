// src/data/constants.ts
export interface PromptSuggestion {
  id: string;
  label: string;
  prompt: string;
  type: "full" | "quick";
}

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: "react-basics",
    label: "⚛️ React Basics",
    prompt:
      "Create a foundational course covering React components, props, state, and the basic lifecycle hooks for beginners.",
    type: "full",
  },
  {
    id: "python-beginners",
    label: "🐍 Python for Beginners",
    prompt:
      "Design a quick-start guide for Python syntax, variables, lists, and basic conditional control blocks.",
    type: "quick",
  },
  {
    id: "html-fundamentals",
    label: "🌐 HTML Fundamentals",
    prompt:
      "A comprehensive structural deep-dive into semantic HTML5 elements, document structures, and accessibility basics.",
    type: "full",
  },
  {
    id: "tailwind-css",
    label: "🎨 Tailwind CSS Mastery",
    prompt:
      "Master utility-first design layouts, modern grid structures, responsive breakpoints, and custom configuration workflows.",
    type: "full",
  },
  {
    id: "javascript-essentials",
    label: "🧠 JavaScript Essentials",
    prompt:
      "A modern review of essential JavaScript features: arrays, arrow functions, promises, and DOM manipulation basics.",
    type: "quick",
  },
  {
    id: "nextjs-quickstart",
    label: "🚀 Next.js Quick Start",
    prompt:
      "Build and deploy a full-stack Next.js web application utilizing the modern App Router architecture.",
    type: "full",
  },
];
