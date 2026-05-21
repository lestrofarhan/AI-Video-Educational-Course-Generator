// config/schema.ts
import { pgTable, serial, varchar, integer ,jsonb, timestamp } from "drizzle-orm/pg-core";

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