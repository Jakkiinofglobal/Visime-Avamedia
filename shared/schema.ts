import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fps: integer("fps").notNull().default(30),
  resolution: text("resolution").notNull().default("1920x1080"),
  visemeComplexity: integer("viseme_complexity").notNull().default(3), // 3, 9, or 14 visemes
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

// 3-VISEME SYSTEM - Simple mode (3 mouth shapes)
export const VISEME_MAP_3 = {
  Baa: { 
    label: "Baa (Closed)", 
    phonemes: ["m", "b", "p", "sil"], // sil = silence/rest position
    color: "hsl(260, 75%, 62%)", 
    example: "mom, bob, pop" 
  },
  Maa: { 
    label: "Maa (Mid)", 
    phonemes: ["w", "r", "l", "y", "er", "hh", "f", "v", "t", "d", "n", "s", "z", "th", "dh", "sh", "zh", "ch", "jh", "k", "g", "ng", "iy", "ih", "ix", "ae", "i", "eh", "ey", "ay", "uw", "uh", "ux", "ow", "u", "oo"], 
    color: "hsl(180, 60%, 50%)", 
    example: "food, wow, heaven" 
  },
  Ohh: { 
    label: "Ohh (Open)", 
    phonemes: ["aa", "ah", "ao", "ax", "aw", "a", "o"], 
    color: "hsl(40, 75%, 55%)", 
    example: "hot, father, god" 
  },
} as const;

// 9-VISEME SYSTEM - Medium detail
export const VISEME_MAP_9 = {
  Baa: { 
    label: "Baa (Closed)", 
    phonemes: ["m", "b", "p", "sil"], // sil = silence/rest position
    color: "hsl(260, 75%, 62%)", 
    example: "mom, bob, pop" 
  },
  Mee: { 
    label: "Mee (Smile)", 
    phonemes: ["iy", "ih", "ix", "ae", "i"], 
    color: "hsl(142, 70%, 45%)", 
    example: "see, bit, cat" 
  },
  Foe: { 
    label: "Foe (Teeth)", 
    phonemes: ["f", "v"], 
    color: "hsl(35, 85%, 55%)", 
    example: "fun, van" 
  },
  Tie: { 
    label: "Tie (Tongue)", 
    phonemes: ["t", "d", "n", "s", "z", "th", "dh"], 
    color: "hsl(200, 70%, 55%)", 
    example: "tie, dog, no" 
  },
  Loo: { 
    label: "Loo (Round)", 
    phonemes: ["uw", "uh", "ux", "ow", "u", "oo"], 
    color: "hsl(320, 65%, 58%)", 
    example: "blue, book, go" 
  },
  Wuh: { 
    label: "Wuh (Glide)", 
    phonemes: ["w", "r", "l", "y", "er", "hh"], 
    color: "hsl(180, 60%, 50%)", 
    example: "wow, red, let" 
  },
  Shhh: { 
    label: "Shhh (Hiss)", 
    phonemes: ["sh", "zh", "ch", "jh"], 
    color: "hsl(280, 65%, 60%)", 
    example: "shoe, measure" 
  },
  Ohh: { 
    label: "Ohh (Open)", 
    phonemes: ["aa", "ah", "ao", "ax", "aw", "a", "o"], 
    color: "hsl(40, 75%, 55%)", 
    example: "hot, father" 
  },
  Ayy: { 
    label: "Ayy (Mid)", 
    phonemes: ["eh", "ey", "ay", "k", "g", "ng"], 
    color: "hsl(15, 85%, 60%)", 
    example: "say, bed, sky" 
  },
} as const;

// 14-VISEME SYSTEM - Full detail (legacy)
export const VISEME_MAP_14 = {
  V1: { label: "Closed (m/b/p)", phonemes: ["m", "b", "p"], color: "hsl(260, 75%, 62%)", example: "mom" },
  V2: { label: "Rest/Silence", phonemes: ["sil"], color: "hsl(220, 10%, 50%)", example: "rest" },
  V3: { label: "AA/AH (hot)", phonemes: ["aa", "ah", "ao"], color: "hsl(142, 70%, 45%)", example: "hot" },
  V4: { label: "AE (cat)", phonemes: ["ae"], color: "hsl(35, 85%, 55%)", example: "cat" },
  V5: { label: "EH/AY (bed/say)", phonemes: ["eh", "ey", "ay"], color: "hsl(200, 70%, 55%)", example: "say" },
  V6: { label: "IY/IX (see)", phonemes: ["iy", "ih", "ix", "i"], color: "hsl(320, 65%, 58%)", example: "see" },
  V7: { label: "OW (go)", phonemes: ["ow"], color: "hsl(180, 60%, 50%)", example: "go" },
  V8: { label: "UW (blue)", phonemes: ["uw", "u", "oo"], color: "hsl(280, 65%, 60%)", example: "blue" },
  V9: { label: "UH (book)", phonemes: ["uh", "ux"], color: "hsl(40, 75%, 55%)", example: "book" },
  V10: { label: "F/V (fun)", phonemes: ["f", "v"], color: "hsl(15, 85%, 60%)", example: "fun" },
  V11: { label: "TH/DH (the)", phonemes: ["th", "dh"], color: "hsl(100, 60%, 50%)", example: "the" },
  V12: { label: "S/Z/SH (shoe)", phonemes: ["s", "z", "sh", "zh", "jh", "ch"], color: "hsl(220, 75%, 60%)", example: "shoe" },
  V13: { label: "R/L/W (red)", phonemes: ["r", "l", "w", "y", "er", "hh"], color: "hsl(300, 65%, 55%)", example: "red" },
  V14: { label: "T/D/K/G/N (dog)", phonemes: ["t", "d", "k", "g", "n", "ng"], color: "hsl(0, 70%, 58%)", example: "dog" },
} as const;

// Helper function to get the correct viseme map based on complexity level
export function getVisemeMap(complexity: number) {
  switch (complexity) {
    case 3:
      return VISEME_MAP_3;
    case 9:
      return VISEME_MAP_9;
    case 14:
      return VISEME_MAP_14;
    default:
      return VISEME_MAP_3; // Default to simplest
  }
}

export type VisemeId3 = keyof typeof VISEME_MAP_3;
export type VisemeId9 = keyof typeof VISEME_MAP_9;
export type VisemeId14 = keyof typeof VISEME_MAP_14;
