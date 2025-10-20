import { projects, visemeClips, type Project, type InsertProject, type VisemeClip, type InsertVisemeClip } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  updateProject(id: string, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Viseme clip operations
  createVisemeClip(clip: InsertVisemeClip): Promise<VisemeClip>;
  getVisemeClipsByProject(projectId: string): Promise<VisemeClip[]>;
  getVisemeClipsByViseme(projectId: string, visemeId: string): Promise<VisemeClip[]>;
  deleteVisemeClip(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const { id: _, ...rawUpdates } = updates as any;
    const safeUpdates = Object.fromEntries(
      Object.entries(rawUpdates).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(safeUpdates).length === 0) {
      return this.getProject(id);
    }
    
    const [updated] = await db
      .update(projects)
      .set(safeUpdates)
      .where(eq(projects.id, id))
      .returning();
    return updated || undefined;
  }

  async createVisemeClip(insertClip: InsertVisemeClip): Promise<VisemeClip> {
    const [clip] = await db
      .insert(visemeClips)
      .values(insertClip)
      .returning();
    return clip;
  }

  async getVisemeClipsByProject(projectId: string): Promise<VisemeClip[]> {
    return await db.select().from(visemeClips).where(eq(visemeClips.projectId, projectId));
  }

  async getVisemeClipsByViseme(projectId: string, visemeId: string): Promise<VisemeClip[]> {
    return await db
      .select()
      .from(visemeClips)
      .where(and(eq(visemeClips.projectId, projectId), eq(visemeClips.visemeId, visemeId)));
  }

  async deleteVisemeClip(id: string): Promise<boolean> {
    const result = await db.delete(visemeClips).where(eq(visemeClips.id, id)).returning();
    return result.length > 0;
  }

  async deleteProject(id: string): Promise<boolean> {
    await db.delete(visemeClips).where(eq(visemeClips.projectId, id));
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
