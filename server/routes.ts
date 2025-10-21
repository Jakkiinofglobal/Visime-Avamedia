import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { insertProjectSchema, insertVisemeClipSchema, getVisemeMap } from "@shared/schema";
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

// Phoneme-to-viseme mapper that supports all three complexity levels
function phonemeToViseme(phoneme: string, complexity: number): string {
  const lowerPhoneme = phoneme.toLowerCase();
  const visemeMap = getVisemeMap(complexity);
  
  for (const [visemeId, data] of Object.entries(visemeMap)) {
    if ((data.phonemes as readonly string[]).includes(lowerPhoneme)) {
      return visemeId;
    }
  }
  
  // Default to first available viseme (Baa for 3 and 9, V1 for 14)
  return complexity === 14 ? "V2" : "Baa";
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
      
      // Fetch project to get its complexity level
      const existingProject = await storage.getProject(req.params.id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get appropriate viseme map based on project complexity
      const visemeMap = getVisemeMap(existingProject.visemeComplexity || 3);
      const visemeIds = Object.keys(visemeMap);

      // Simulate phoneme alignment (in production, use WhisperX or Vosk)
      // Generate mock timeline using valid viseme IDs for this complexity level
      const mockTimeline = visemeIds.length >= 3 ? [
        { phoneme: visemeMap[visemeIds[0]].phonemes[0], start: 0.0, end: 0.15, viseme: visemeIds[0] },
        { phoneme: visemeMap[visemeIds[1]].phonemes[0], start: 0.15, end: 0.30, viseme: visemeIds[1] },
        { phoneme: visemeMap[visemeIds[2]].phonemes[0], start: 0.30, end: 0.45, viseme: visemeIds[2] },
        { phoneme: visemeMap[visemeIds[0]].phonemes[1] || visemeMap[visemeIds[0]].phonemes[0], start: 0.45, end: 0.60, viseme: visemeIds[0] },
        ...(visemeIds.length > 3 ? [
          { phoneme: visemeMap[visemeIds[3]].phonemes[0], start: 0.60, end: 0.75, viseme: visemeIds[3] },
          { phoneme: visemeMap[visemeIds[4 % visemeIds.length]].phonemes[0], start: 0.75, end: 0.90, viseme: visemeIds[4 % visemeIds.length] },
          { phoneme: visemeMap[visemeIds[5 % visemeIds.length]].phonemes[0], start: 0.90, end: 1.05, viseme: visemeIds[5 % visemeIds.length] },
          { phoneme: visemeMap[visemeIds[6 % visemeIds.length]].phonemes[0], start: 1.05, end: 1.20, viseme: visemeIds[6 % visemeIds.length] },
        ] : [])
      ] : [];

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

      // Get project to validate viseme ID against the project's complexity level
      const project = await storage.getProject(req.params.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Validate that visemeId matches the project's complexity level
      const validVisemeIds = Object.keys(getVisemeMap(project.visemeComplexity));
      if (!validVisemeIds.includes(visemeId)) {
        return res.status(400).json({ 
          error: `Invalid visemeId for ${project.visemeComplexity}-viseme project. Must be one of: ${validVisemeIds.join(", ")}` 
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
      const { text, complexity = 3 } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const phonemes = textToPhonemes(text);
      const timeline = [];
      let currentTime = 0;
      const avgDuration = 0.15; // Average phoneme duration

      for (const phoneme of phonemes) {
        const viseme = phonemeToViseme(phoneme, complexity);
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
