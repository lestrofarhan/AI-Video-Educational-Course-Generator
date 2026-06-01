CREATE TABLE "chapter_content_slides" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar(255) NOT NULL,
	"chapter_id" varchar(255) NOT NULL,
	"slide_id" varchar(255) NOT NULL,
	"slide_index" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"audio_file_name" varchar(255) NOT NULL,
	"audio_file_url" text,
	"narration" jsonb NOT NULL,
	"html_content" text NOT NULL,
	"revel_data" jsonb NOT NULL,
	"captions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_content_slides_slide_id_unique" UNIQUE("slide_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar(255) NOT NULL,
	"course_name" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_input" varchar(1000) NOT NULL,
	"type" varchar(50) NOT NULL,
	"course_layout" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_course_id_unique" UNIQUE("course_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"credits" integer DEFAULT 2 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
