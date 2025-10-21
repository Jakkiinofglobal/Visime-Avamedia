import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertProjectSchema, insertVisemeClipSchema, VISEME_MAP } from "@shared/schema";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "viseme-avatar",
      resource_type: "auto", // Supports video, image, and audio
      allowed_formats: ["mp4", "webm", "mov", "mp3", "wav", "ogg", "jpg", "jpeg", "png", "gif"],
    };
  },
});

const upload = multer({ 
  storage: cloudinaryStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Simple phoneme-to-viseme mapper using the new 9-viseme system
function phonemeToViseme(phoneme: string): string {
  const lowerPhoneme = phoneme.toLowerCase();
  
  for (const [visemeId, data] of Object.entries(VISEME_MAP)) {
    if ((data.phonemes as readonly string[]).includes(lowerPhoneme)) {
      return visemeId;
    }
  }
  
  // Default to Baa (closed/rest position) for unmapped phonemes
  // This includes silence markers and unknown phonemes
  return "Baa";
}

// Basic grapheme-to-phoneme converter (simplified)
function textToPhonemes(text: string): string[] {
  const phonemes: string[] = [];
  const words = text.toLowerCase().split(/\s+/);
  
  // Very basic mapping - in production, use a proper G2P library
  const phonemeMap: Record<string, string[]> = {
    "the": ["dh", "ah"],
    "quick": ["k", "w", "ih", "k"],
    "brown": ["b", "r", "aw", "n"],
    "fox": ["f", "aa", "k", "s"],
    "jumps": ["jh", "ah", "m", "p", "s"],
    "over": ["ow", "v", "er"],
    "lazy": ["l", "ey", "z", "iy"],
    "dog": ["d", "ao", "g"],
    "hello": ["hh", "eh", "l", "ow"],
    "world": ["w", "er", "l", "d"],
  };
  
  for (const word of words) {
    if (phonemeMap[word]) {
      phonemes.push(...phonemeMap[word]);
    } else {
      // Fallback: rough letter-to-phoneme
      for (const char of word) {
        if (/[aeiou]/.test(char)) phonemes.push("ah");
        else if (char === "s" || char === "z") phonemes.push("s");
        else if (char === "t" || char === "d") phonemes.push("t");
        else phonemes.push("k");
      }
    }
    phonemes.push("sil"); // Add pause between words
  }
  
  return phonemes;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Files are now served from Cloudinary, no local static serving needed

  // Create project
  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data);
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get all projects
  app.get("/api/projects", async (_req, res) => {
    const projects = await storage.getAllProjects();
    res.json(projects);
  });

  // Get project by ID
  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  });

  // Schema for safe project updates (prevents id overwrite)
  const updateProjectSchema = z.object({
    name: z.string().optional(),
    fps: z.number().optional(),
    resolution: z.string().optional(),
    trainingAudioUrl: z.string().nullable().optional(),
    phonemeTimeline: z.any().optional(),
    restPositionClipUrl: z.string().nullable().optional(),
    backgroundImageUrl: z.string().nullable().optional(),
  });

  // Update project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const validatedUpdates = updateProjectSchema.parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedUpdates);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data", details: error.errors });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Delete failed" });
    }
  });

  // Upload training audio
  app.post("/api/projects/:id/training-audio", upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const audioUrl = req.file.path; // Cloudinary URL
      
      // Simulate phoneme alignment (in production, use WhisperX or Vosk)
      // Using new simplified 9-viseme system
      const mockTimeline = [
        { phoneme: "dh", start: 0.0, end: 0.15, viseme: "Tie" },    // th sound
        { phoneme: "ah", start: 0.15, end: 0.30, viseme: "Ohh" },   // open vowel
        { phoneme: "k", start: 0.30, end: 0.45, viseme: "Ayy" },    // k/g sound
        { phoneme: "w", start: 0.45, end: 0.60, viseme: "Wuh" },    // w glide
        { phoneme: "ih", start: 0.60, end: 0.75, viseme: "Mee" },   // smile vowel
        { phoneme: "k", start: 0.75, end: 0.90, viseme: "Ayy" },    // k/g sound
        { phoneme: "b", start: 0.90, end: 1.05, viseme: "Baa" },    // closed lips
        { phoneme: "r", start: 1.05, end: 1.20, viseme: "Wuh" },    // r glide
      ];

      const project = await storage.updateProject(req.params.id, {
        trainingAudioUrl: audioUrl,
        phonemeTimeline: mockTimeline as any,
      });

      res.json({ audioUrl, timeline: mockTimeline, project });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  // Upload rest position clip
  app.post("/api/projects/:id/rest-position", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const clipUrl = req.file.path; // Cloudinary URL
      
      const project = await storage.updateProject(req.params.id, {
        restPositionClipUrl: clipUrl,
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json({ clipUrl, project });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  // Upload background image
  app.post("/api/projects/:id/background", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const imageUrl = req.file.path; // Cloudinary URL
      
      const project = await storage.updateProject(req.params.id, {
        backgroundImageUrl: imageUrl,
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json({ imageUrl, project });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  // Upload viseme clip
  app.post("/api/projects/:projectId/clips", upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { visemeId, variantIndex = "0" } = req.body;
      
      if (!visemeId) {
        return res.status(400).json({ error: "visemeId is required" });
      }

      // Validate that visemeId is one of the new 9-viseme categories
      // This prevents legacy V1-V14 IDs from being uploaded
      const validVisemeIds = Object.keys(VISEME_MAP);
      if (!validVisemeIds.includes(visemeId)) {
        return res.status(400).json({ 
          error: `Invalid visemeId. Must be one of: ${validVisemeIds.join(", ")}` 
        });
      }

      const clipUrl = req.file.path; // Cloudinary URL
      
      const clipData = insertVisemeClipSchema.parse({
        projectId: req.params.projectId,
        visemeId,
        clipUrl,
        duration: 800, // Default 800ms, should be extracted from video
        variantIndex: parseInt(variantIndex),
      });

      const clip = await storage.createVisemeClip(clipData);
      res.json(clip);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  // Get clips for a project
  app.get("/api/projects/:projectId/clips", async (req, res) => {
    const clips = await storage.getVisemeClipsByProject(req.params.projectId);
    res.json(clips);
  });

  // Get clips for a specific viseme
  app.get("/api/projects/:projectId/clips/:visemeId", async (req, res) => {
    const clips = await storage.getVisemeClipsByViseme(
      req.params.projectId,
      req.params.visemeId
    );
    res.json(clips);
  });

  // Delete a clip
  app.delete("/api/clips/:clipId", async (req, res) => {
    const success = await storage.deleteVisemeClip(req.params.clipId);
    if (!success) {
      return res.status(404).json({ error: "Clip not found" });
    }
    res.json({ success: true });
  });

  // Text to viseme timeline
  app.post("/api/text-to-visemes", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const phonemes = textToPhonemes(text);
      const timeline = [];
      let currentTime = 0;
      const avgDuration = 0.15; // Average phoneme duration

      for (const phoneme of phonemes) {
        const viseme = phonemeToViseme(phoneme);
        timeline.push({
          phoneme,
          start: currentTime,
          end: currentTime + avgDuration,
          viseme,
        });
        currentTime += avgDuration;
      }

      res.json({ timeline, duration: currentTime });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
