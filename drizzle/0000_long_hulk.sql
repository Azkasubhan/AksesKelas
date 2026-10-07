CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"material_id" uuid,
	"event_type" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_memberships" (
	"class_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_memberships_class_id_student_id_pk" PRIMARY KEY("class_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"teacher_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"join_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classes_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
CREATE TABLE "lesson_drafts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"source_revision_id" uuid NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"status" text NOT NULL,
	"content" jsonb DEFAULT '{"sections":[]}'::jsonb NOT NULL,
	"approvals" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model_id" text,
	"prompt_version" text NOT NULL,
	"schema_version" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_drafts_id_material_unique" UNIQUE("id","material_id"),
	CONSTRAINT "lesson_drafts_revision_check" CHECK ("lesson_drafts"."revision" > 0),
	CONSTRAINT "lesson_drafts_status_check" CHECK ("lesson_drafts"."status" IN ('generating','review','ready','failed'))
);
--> statement-breakpoint
CREATE TABLE "lesson_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"source_revision_id" uuid NOT NULL,
	"draft_id" uuid NOT NULL,
	"draft_revision" integer NOT NULL,
	"version_number" integer NOT NULL,
	"content" jsonb NOT NULL,
	"schema_version" text NOT NULL,
	"approved_by" uuid NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_versions_material_number_unique" UNIQUE("material_id","version_number"),
	CONSTRAINT "lesson_versions_material_draft_revision_unique" UNIQUE("material_id","draft_id","draft_revision"),
	CONSTRAINT "lesson_versions_id_material_unique" UNIQUE("id","material_id"),
	CONSTRAINT "lesson_versions_number_check" CHECK ("lesson_versions"."version_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"class_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"description" text,
	"current_version_id" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processing_jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"source_revision_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"checkpoint" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stage" text NOT NULL,
	"completed_units" integer DEFAULT 0 NOT NULL,
	"total_units" integer,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_until" timestamp with time zone,
	"lease_token" uuid,
	"error_code" text,
	"usage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processing_jobs_idempotency_unique" UNIQUE("requested_by","idempotency_key"),
	CONSTRAINT "processing_jobs_kind_check" CHECK ("processing_jobs"."kind" IN ('extract','structure','adapt','regenerate')),
	CONSTRAINT "processing_jobs_status_check" CHECK ("processing_jobs"."status" IN ('queued','running','retry_wait','succeeded','failed'))
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "rate_limit_buckets_key_window_start_pk" PRIMARY KEY("key","window_start")
);
--> statement-breakpoint
CREATE TABLE "reading_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"structure" text DEFAULT 'standard' NOT NULL,
	"easy_read" boolean DEFAULT false NOT NULL,
	"font_family" text DEFAULT 'inter' NOT NULL,
	"font_size" integer DEFAULT 20 NOT NULL,
	"line_height" numeric DEFAULT '1.7' NOT NULL,
	"letter_spacing" numeric DEFAULT '0' NOT NULL,
	"line_width" integer DEFAULT 60 NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"motion" text DEFAULT 'system' NOT NULL,
	"listen_enabled" boolean DEFAULT false NOT NULL,
	"speech_rate" numeric DEFAULT '1' NOT NULL,
	"voice_uri" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pref_structure_check" CHECK ("reading_preferences"."structure" IN ('standard','focus')),
	CONSTRAINT "pref_font_family_check" CHECK ("reading_preferences"."font_family" IN ('inter','system','atkinson')),
	CONSTRAINT "pref_font_size_check" CHECK ("reading_preferences"."font_size" IN (18,20,22,24,28)),
	CONSTRAINT "pref_line_height_check" CHECK ("reading_preferences"."line_height" IN (1.5,1.7,2.0)),
	CONSTRAINT "pref_letter_spacing_check" CHECK ("reading_preferences"."letter_spacing" IN (0,0.02,0.04)),
	CONSTRAINT "pref_line_width_check" CHECK ("reading_preferences"."line_width" IN (45,60,75)),
	CONSTRAINT "pref_theme_check" CHECK ("reading_preferences"."theme" IN ('light','sepia','high-contrast')),
	CONSTRAINT "pref_motion_check" CHECK ("reading_preferences"."motion" IN ('system','off')),
	CONSTRAINT "pref_speech_rate_check" CHECK ("reading_preferences"."speech_rate" BETWEEN 0.75 AND 1.5)
);
--> statement-breakpoint
CREATE TABLE "reading_progress" (
	"student_id" uuid NOT NULL,
	"lesson_version_id" uuid NOT NULL,
	"section_id" text,
	"card_id" text,
	"scroll_fraction" numeric,
	"completed_section_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_progress_student_id_lesson_version_id_pk" PRIMARY KEY("student_id","lesson_version_id"),
	CONSTRAINT "reading_progress_scroll_check" CHECK ("reading_progress"."scroll_fraction" BETWEEN 0 AND 1)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "source_blocks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_revision_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"page_number" integer,
	"text" text NOT NULL,
	CONSTRAINT "source_blocks_revision_ordinal_unique" UNIQUE("source_revision_id","ordinal"),
	CONSTRAINT "source_blocks_ordinal_check" CHECK ("source_blocks"."ordinal" >= 0),
	CONSTRAINT "source_blocks_page_check" CHECK ("source_blocks"."page_number" > 0),
	CONSTRAINT "source_blocks_text_check" CHECK (length("source_blocks"."text") > 0)
);
--> statement-breakpoint
CREATE TABLE "source_revisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"material_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"input_type" text NOT NULL,
	"storage_key" text,
	"original_filename" text,
	"sha256" text NOT NULL,
	"page_count" integer,
	"extraction_status" text NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_revisions_material_number_unique" UNIQUE("material_id","revision_number"),
	CONSTRAINT "source_revisions_id_material_unique" UNIQUE("id","material_id"),
	CONSTRAINT "source_revisions_number_check" CHECK ("source_revisions"."revision_number" > 0),
	CONSTRAINT "source_revisions_input_check" CHECK ("source_revisions"."input_type" IN ('pdf','text')),
	CONSTRAINT "source_revisions_status_check" CHECK ("source_revisions"."extraction_status" IN ('queued','extracting','ready','failed'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_role_check" CHECK ("users"."role" IN ('teacher','student'))
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_memberships" ADD CONSTRAINT "class_memberships_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_memberships" ADD CONSTRAINT "class_memberships_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_drafts" ADD CONSTRAINT "lesson_drafts_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_drafts" ADD CONSTRAINT "lesson_drafts_source_fk" FOREIGN KEY ("source_revision_id","material_id") REFERENCES "public"."source_revisions"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_source_fk" FOREIGN KEY ("source_revision_id","material_id") REFERENCES "public"."source_revisions"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_draft_fk" FOREIGN KEY ("draft_id","material_id") REFERENCES "public"."lesson_drafts"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_current_version_fk" FOREIGN KEY ("current_version_id","id") REFERENCES "public"."lesson_versions"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_source_fk" FOREIGN KEY ("source_revision_id","material_id") REFERENCES "public"."source_revisions"("id","material_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_preferences" ADD CONSTRAINT "reading_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_blocks" ADD CONSTRAINT "source_blocks_source_revision_id_source_revisions_id_fk" FOREIGN KEY ("source_revision_id") REFERENCES "public"."source_revisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_revisions" ADD CONSTRAINT "source_revisions_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_material_idx" ON "audit_events" USING btree ("material_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "memberships_student_idx" ON "class_memberships" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "classes_teacher_idx" ON "classes" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "drafts_material_idx" ON "lesson_drafts" USING btree ("material_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "materials_class_idx" ON "materials" USING btree ("class_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "jobs_claim_idx" ON "processing_jobs" USING btree ("status","available_at");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_one_active_material_idx" ON "processing_jobs" USING btree ("material_id") WHERE "processing_jobs"."status" IN ('queued','running','retry_wait');--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "source_blocks_revision_idx" ON "source_blocks" USING btree ("source_revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));