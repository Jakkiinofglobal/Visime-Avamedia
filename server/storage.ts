import { type Project, type InsertProject, type VisemeClip, type InsertVisemeClip } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private visemeClips: Map<string, VisemeClip>;

  constructor() {
    this.projects = new Map();
    this.visemeClips = new Map();
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
    };
    this.projects.set(id, project);
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
    
    const updated = { ...project, ...updates };
    this.projects.set(id, updated);
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
    return this.visemeClips.delete(id);
  }
}

export const storage = new MemStorage();
