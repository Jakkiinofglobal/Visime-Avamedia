import { type Project, type InsertProject, type VisemeClip, type InsertVisemeClip } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  updateProject(id: string, project: Partial<Project>): Promise<Project | undefined>;
  
  // Viseme clip operations
  createVisemeClip(clip: InsertVisemeClip): Promise<VisemeClip>;
  getVisemeClipsByProject(projectId: string): Promise<VisemeClip[]>;
  getVisemeClipsByViseme(projectId: string, visemeId: string): Promise<VisemeClip[]>;
  deleteVisemeClip(id: string): Promise<boolean>;
}

interface StorageData {
  projects: [string, Project][];
  visemeClips: [string, VisemeClip][];
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private visemeClips: Map<string, VisemeClip>;
  private dataFilePath: string;

  constructor() {
    this.projects = new Map();
    this.visemeClips = new Map();
    this.dataFilePath = path.join(process.cwd(), "uploads", "data.json");
    this.loadFromFileSync();
  }

  private loadFromFileSync(): void {
    try {
      const fsSyncModule = require("fs");
      const data = fsSyncModule.readFileSync(this.dataFilePath, "utf-8");
      const parsed: StorageData = JSON.parse(data);
      this.projects = new Map(parsed.projects);
      this.visemeClips = new Map(parsed.visemeClips);
      console.log("Storage loaded from file:", {
        projects: this.projects.size,
        clips: this.visemeClips.size,
      });
    } catch (error) {
      console.log("No existing storage file found, starting fresh");
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const fsSyncModule = require("fs");
      const uploadsDir = path.join(process.cwd(), "uploads");
      
      if (!fsSyncModule.existsSync(uploadsDir)) {
        await fs.mkdir(uploadsDir, { recursive: true });
      }
      
      const data: StorageData = {
        projects: Array.from(this.projects.entries()),
        visemeClips: Array.from(this.visemeClips.entries()),
      };
      await fs.writeFile(this.dataFilePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save storage to file:", error);
    }
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { 
      id,
      name: insertProject.name,
      fps: insertProject.fps ?? 30,
      resolution: insertProject.resolution ?? "1920x1080",
      trainingAudioUrl: insertProject.trainingAudioUrl ?? null,
      phonemeTimeline: insertProject.phonemeTimeline ?? null,
      restPositionClipUrl: insertProject.restPositionClipUrl ?? null,
      backgroundImageUrl: insertProject.backgroundImageUrl ?? null,
    };
    this.projects.set(id, project);
    await this.saveToFile();
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    // Prevent overwriting id to maintain data integrity
    const { id: _, ...safeUpdates } = updates as any;
    const updated = { ...project, ...safeUpdates };
    this.projects.set(id, updated);
    await this.saveToFile();
    return updated;
  }

  async createVisemeClip(insertClip: InsertVisemeClip): Promise<VisemeClip> {
    const id = randomUUID();
    const clip: VisemeClip = { 
      id,
      projectId: insertClip.projectId,
      visemeId: insertClip.visemeId,
      clipUrl: insertClip.clipUrl,
      duration: insertClip.duration,
      variantIndex: insertClip.variantIndex ?? 0,
    };
    this.visemeClips.set(id, clip);
    await this.saveToFile();
    return clip;
  }

  async getVisemeClipsByProject(projectId: string): Promise<VisemeClip[]> {
    return Array.from(this.visemeClips.values()).filter(
      (clip) => clip.projectId === projectId
    );
  }

  async getVisemeClipsByViseme(projectId: string, visemeId: string): Promise<VisemeClip[]> {
    return Array.from(this.visemeClips.values()).filter(
      (clip) => clip.projectId === projectId && clip.visemeId === visemeId
    );
  }

  async deleteVisemeClip(id: string): Promise<boolean> {
    const success = this.visemeClips.delete(id);
    if (success) {
      await this.saveToFile();
    }
    return success;
  }
}

export const storage = new MemStorage();
