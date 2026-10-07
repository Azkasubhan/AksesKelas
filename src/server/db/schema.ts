/**
 * Skema PostgreSQL AksesKelas (PRD bagian 10.2).
 * Kontrak minimal: relasi, unique constraint, check, dan index mengikuti PRD.
 * UUID dibuat aplikasi (crypto.randomUUID), waktu timestamptz UTC.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const ts = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    check("users_role_check", sql`${t.role} IN ('teacher','student')`),
    uniqueIndex("users_email_unique").on(sql`lower(${t.email})`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: ts("expires_at").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    description: text("description"),
    joinCode: text("join_code").notNull().unique(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("classes_teacher_idx").on(t.teacherId)],
);

export const classMemberships = pgTable(
  "class_memberships",
  {
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: ts("joined_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.classId, t.studentId] }),
    index("memberships_student_idx").on(t.studentId),
  ],
);

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    subject: text("subject").notNull(),
    description: text("description"),
    currentVersionId: uuid("current_version_id"),
    archivedAt: ts("archived_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (t): any => [
    index("materials_class_idx").on(t.classId, t.createdAt.desc()),
    // Pointer versi aktif tidak boleh menunjuk versi milik materi lain.
    foreignKey({
      name: "materials_current_version_fk",
      columns: [t.currentVersionId, t.id],
      foreignColumns: [lessonVersions.id, lessonVersions.materialId] as unknown as [AnyPgColumn, AnyPgColumn],
    }),
  ],
);

export const sourceRevisions = pgTable(
  "source_revisions",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
    revisionNumber: integer("revision_number").notNull(),
    inputType: text("input_type").notNull(),
    storageKey: text("storage_key"),
    originalFilename: text("original_filename"),
    sha256: text("sha256").notNull(),
    pageCount: integer("page_count"),
    extractionStatus: text("extraction_status").notNull(),
    confirmedAt: ts("confirmed_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    check("source_revisions_number_check", sql`${t.revisionNumber} > 0`),
    check("source_revisions_input_check", sql`${t.inputType} IN ('pdf','text')`),
    check(
      "source_revisions_status_check",
      sql`${t.extractionStatus} IN ('queued','extracting','ready','failed')`,
    ),
    unique("source_revisions_material_number_unique").on(
      t.materialId,
      t.revisionNumber,
    ),
    unique("source_revisions_id_material_unique").on(t.id, t.materialId),
  ],
);

export const sourceBlocks = pgTable(
  "source_blocks",
  {
    id: uuid("id").primaryKey(),
    sourceRevisionId: uuid("source_revision_id")
      .notNull()
      .references(() => sourceRevisions.id),
    ordinal: integer("ordinal").notNull(),
    pageNumber: integer("page_number"),
    text: text("text").notNull(),
  },
  (t) => [
    check("source_blocks_ordinal_check", sql`${t.ordinal} >= 0`),
    check("source_blocks_page_check", sql`${t.pageNumber} > 0`),
    check("source_blocks_text_check", sql`length(${t.text}) > 0`),
    unique("source_blocks_revision_ordinal_unique").on(
      t.sourceRevisionId,
      t.ordinal,
    ),
    index("source_blocks_revision_idx").on(t.sourceRevisionId),
  ],
);

export const lessonDrafts = pgTable(
  "lesson_drafts",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
    sourceRevisionId: uuid("source_revision_id").notNull(),
    revision: integer("revision").notNull().default(1),
    status: text("status").notNull(),
    content: jsonb("content")
      .notNull()
      .default(sql`'{"sections":[]}'::jsonb`),
    approvals: jsonb("approvals")
      .notNull()
      .default(sql`'{}'::jsonb`),
    modelId: text("model_id"),
    promptVersion: text("prompt_version").notNull(),
    schemaVersion: text("schema_version").notNull(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check("lesson_drafts_revision_check", sql`${t.revision} > 0`),
    check(
      "lesson_drafts_status_check",
      sql`${t.status} IN ('generating','review','ready','failed')`,
    ),
    foreignKey({
      name: "lesson_drafts_source_fk",
      columns: [t.sourceRevisionId, t.materialId],
      foreignColumns: [sourceRevisions.id, sourceRevisions.materialId],
    }),
    unique("lesson_drafts_id_material_unique").on(t.id, t.materialId),
    index("drafts_material_idx").on(t.materialId, t.updatedAt.desc()),
  ],
);

export const lessonVersions = pgTable(
  "lesson_versions",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references((): AnyPgColumn => materials.id),
    sourceRevisionId: uuid("source_revision_id").notNull(),
    draftId: uuid("draft_id").notNull(),
    draftRevision: integer("draft_revision").notNull(),
    versionNumber: integer("version_number").notNull(),
    content: jsonb("content").notNull(),
    schemaVersion: text("schema_version").notNull(),
    approvedBy: uuid("approved_by")
      .notNull()
      .references(() => users.id),
    publishedAt: ts("published_at").notNull().defaultNow(),
  },
  (t) => [
    check("lesson_versions_number_check", sql`${t.versionNumber} > 0`),
    foreignKey({
      name: "lesson_versions_source_fk",
      columns: [t.sourceRevisionId, t.materialId],
      foreignColumns: [sourceRevisions.id, sourceRevisions.materialId],
    }),
    foreignKey({
      name: "lesson_versions_draft_fk",
      columns: [t.draftId, t.materialId],
      foreignColumns: [lessonDrafts.id, lessonDrafts.materialId],
    }),
    unique("lesson_versions_material_number_unique").on(
      t.materialId,
      t.versionNumber,
    ),
    unique("lesson_versions_material_draft_revision_unique").on(
      t.materialId,
      t.draftId,
      t.draftRevision,
    ),
    unique("lesson_versions_id_material_unique").on(t.id, t.materialId),
  ],
);

export const readingPreferences = pgTable(
  "reading_preferences",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    structure: text("structure").notNull().default("standard"),
    easyRead: boolean("easy_read").notNull().default(false),
    fontFamily: text("font_family").notNull().default("inter"),
    fontSize: integer("font_size").notNull().default(20),
    lineHeight: numeric("line_height").notNull().default("1.7"),
    letterSpacing: numeric("letter_spacing").notNull().default("0"),
    lineWidth: integer("line_width").notNull().default(60),
    theme: text("theme").notNull().default("light"),
    motion: text("motion").notNull().default("system"),
    listenEnabled: boolean("listen_enabled").notNull().default(false),
    speechRate: numeric("speech_rate").notNull().default("1"),
    voiceUri: text("voice_uri"),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check("pref_structure_check", sql`${t.structure} IN ('standard','focus')`),
    check("pref_font_family_check", sql`${t.fontFamily} IN ('inter','system','atkinson')`),
    check("pref_font_size_check", sql`${t.fontSize} IN (18,20,22,24,28)`),
    check("pref_line_height_check", sql`${t.lineHeight} IN (1.5,1.7,2.0)`),
    check("pref_letter_spacing_check", sql`${t.letterSpacing} IN (0,0.02,0.04)`),
    check("pref_line_width_check", sql`${t.lineWidth} IN (45,60,75)`),
    check("pref_theme_check", sql`${t.theme} IN ('light','sepia','high-contrast')`),
    check("pref_motion_check", sql`${t.motion} IN ('system','off')`),
    check("pref_speech_rate_check", sql`${t.speechRate} BETWEEN 0.75 AND 1.5`),
  ],
);

export const readingProgress = pgTable(
  "reading_progress",
  {
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonVersionId: uuid("lesson_version_id")
      .notNull()
      .references(() => lessonVersions.id),
    sectionId: text("section_id"),
    cardId: text("card_id"),
    scrollFraction: numeric("scroll_fraction"),
    completedSectionIds: jsonb("completed_section_ids")
      .notNull()
      .default(sql`'[]'::jsonb`),
    startedAt: ts("started_at").notNull().defaultNow(),
    completedAt: ts("completed_at"),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.studentId, t.lessonVersionId] }),
    check("reading_progress_scroll_check", sql`${t.scrollFraction} BETWEEN 0 AND 1`),
  ],
);

export const processingJobs = pgTable(
  "processing_jobs",
  {
    id: uuid("id").primaryKey(),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id),
    sourceRevisionId: uuid("source_revision_id").notNull(),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id),
    kind: text("kind").notNull(),
    status: text("status").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    requestHash: text("request_hash").notNull(),
    payload: jsonb("payload").notNull(),
    checkpoint: jsonb("checkpoint")
      .notNull()
      .default(sql`'{}'::jsonb`),
    stage: text("stage").notNull(),
    completedUnits: integer("completed_units").notNull().default(0),
    totalUnits: integer("total_units"),
    attempts: integer("attempts").notNull().default(0),
    availableAt: ts("available_at").notNull().defaultNow(),
    leaseUntil: ts("lease_until"),
    leaseToken: uuid("lease_token"),
    errorCode: text("error_code"),
    usage: jsonb("usage"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check(
      "processing_jobs_kind_check",
      sql`${t.kind} IN ('extract','structure','adapt','regenerate')`,
    ),
    check(
      "processing_jobs_status_check",
      sql`${t.status} IN ('queued','running','retry_wait','succeeded','failed')`,
    ),
    foreignKey({
      name: "processing_jobs_source_fk",
      columns: [t.sourceRevisionId, t.materialId],
      foreignColumns: [sourceRevisions.id, sourceRevisions.materialId],
    }),
    unique("processing_jobs_idempotency_unique").on(
      t.requestedBy,
      t.idempotencyKey,
    ),
    index("jobs_claim_idx").on(t.status, t.availableAt),
    // Satu job aktif per materi.
    uniqueIndex("jobs_one_active_material_idx")
      .on(t.materialId)
      .where(sql`${t.status} IN ('queued','running','retry_wait')`),
  ],
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    materialId: uuid("material_id").references(() => materials.id),
    eventType: text("event_type").notNull(),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_material_idx").on(t.materialId, t.createdAt.desc())],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_buckets",
  {
    key: text("key").notNull(),
    windowStart: ts("window_start").notNull(),
    requestCount: integer("request_count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

export type User = typeof users.$inferSelect;
export type ClassRow = typeof classes.$inferSelect;
