// config/schema.ts
import {
  pgTable,
  serial,
  varchar,
  integer,
  jsonb,
  timestamp,
  text,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  credits: integer("credits").default(2).notNull(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseId: varchar("course_id", { length: 255 }).notNull().unique(),
  courseName: varchar("course_name", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(), // User's email from Clerk
  userInput: varchar("user_input", { length: 1000 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'full' or 'quick'
  courseLayout: jsonb("course_layout").notNull(), // Stores the generated chapters JSON object
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chapterContentSlides = pgTable("chapter_content_slides", {
  id: serial("id").primaryKey(),
  courseId: varchar("course_id", { length: 255 }).notNull(),
  chapterId: varchar("chapter_id", { length: 255 }).notNull(),
  slideId: varchar("slide_id", { length: 255 }).notNull().unique(), // e.g., "intro-setup-01"
  slideIndex: integer("slide_index").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: text("subtitle"),
  audioFileName: varchar("audio_file_name", { length: 255 }).notNull(), // e.g., "intro-setup-01.mp3"
  audioFileUrl: text("audio_file_url"), // Persistent storage public URL
  narration: jsonb("narration").notNull(), // Stores { fullText: "..." }
  htmlContent: text("html_content").notNull(), // Self-contained code string with Tailwind CDN
  revelData: jsonb("revel_data").notNull(), // Array of reveal keys: ["r1", "r2", ...]
  captions: jsonb("captions"), // Timestamps for synchronization
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const audioTracks = pgTable("audio_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptText: text("prompt_text").notNull(),
  audioData: text("audio_data").notNull(), // Stores the base64 encoded audio string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});