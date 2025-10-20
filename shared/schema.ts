import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fps: integer("fps").notNull().default(30),
  resolution: text("resolution").notNull().default("1920x1080"),
  trainingAudioUrl: text("training_audio_url"),
  phonemeTimeline: jsonb("phoneme_timeline"),
  restPositionClipUrl: text("rest_position_clip_url"),
  backgroundImageUrl: text("background_image_url"),
});

export const visemeClips = pgTable("viseme_clips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  visemeId: text("viseme_id").notNull(),
  clipUrl: text("clip_url").notNull(),
  duration: integer("duration").notNull(),
  variantIndex: integer("variant_index").notNull().default(0),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

export const insertVisemeClipSchema = createInsertSchema(visemeClips).omit({
  id: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertVisemeClip = z.infer<typeof insertVisemeClipSchema>;
export type VisemeClip = typeof visemeClips.$inferSelect;

export interface PhonemeSegment {
  phoneme: string;
  start: number;
  end: number;
  viseme: string;
}

export const VISEME_MAP = {
  V1: { label: "Closed", phonemes: ["m", "b", "p"], color: "hsl(260, 75%, 62%)" },
  V2: { label: "Rest/Neutral", phonemes: ["sil"], color: "hsl(220, 10%, 50%)" },
  V3: { label: "AA/AH", phonemes: ["aa", "ah", "ao"], color: "hsl(142, 70%, 45%)" },
  V4: { label: "AE", phonemes: ["ae"], color: "hsl(35, 85%, 55%)" },
  V5: { label: "EH/AY", phonemes: ["eh", "ey"], color: "hsl(200, 70%, 55%)" },
  V6: { label: "IY/IX", phonemes: ["iy", "ih", "ix"], color: "hsl(320, 65%, 58%)" },
  V7: { label: "OW", phonemes: ["ow"], color: "hsl(180, 60%, 50%)" },
  V8: { label: "UW", phonemes: ["uw"], color: "hsl(280, 65%, 60%)" },
  V9: { label: "AO/OO", phonemes: ["uh", "ux"], color: "hsl(40, 75%, 55%)" },
  V10: { label: "F/V", phonemes: ["f", "v"], color: "hsl(15, 85%, 60%)" },
  V11: { label: "TH/DH", phonemes: ["th", "dh"], color: "hsl(100, 60%, 50%)" },
  V12: { label: "S/Z/SH", phonemes: ["s", "z", "sh", "zh", "jh", "ch"], color: "hsl(220, 75%, 60%)" },
  V13: { label: "R/L", phonemes: ["r", "l"], color: "hsl(300, 65%, 55%)" },
  V14: { label: "T/D/K/G/N", phonemes: ["t", "d", "k", "g", "n"], color: "hsl(0, 70%, 58%)" },
} as const;

export type VisemeId = keyof typeof VISEME_MAP;
