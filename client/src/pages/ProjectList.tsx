import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Video } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ThemeToggle from "@/components/ThemeToggle";
import type { Project } from "@shared/schema";

export default function ProjectList() {
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [fps, setFps] = useState("30");
  const [resolution, setResolution] = useState("1920x1080");

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; fps: number; resolution: string }) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return await response.json() as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowCreateDialog(false);
      setProjectName("");
      setLocation(`/project/${project.id}`);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    
    createProjectMutation.mutate({
      name: projectName,
      fps: parseInt(fps),
      resolution: resolution,
    });
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this avatar? This cannot be undone.")) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="h-14 border-b bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">VA</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Viseme Avatar Studio</h1>
            <p className="text-xs text-muted-foreground">
              Manage Your Virtual Avatars
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-avatar">
                <Plus className="w-4 h-4 mr-2" />
                New Avatar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Avatar</DialogTitle>
                <DialogDescription>
                  Set up a new virtual avatar for streaming
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Avatar Name</Label>
                  <Input
                    id="project-name"
                    data-testid="input-project-name"
                    placeholder="My Gaming Avatar"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fps">FPS</Label>
                  <Select value={fps} onValueChange={setFps}>
                    <SelectTrigger id="fps" data-testid="select-fps">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 FPS</SelectItem>
                      <SelectItem value="30">30 FPS</SelectItem>
                      <SelectItem value="60">60 FPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger id="resolution" data-testid="select-resolution">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1280x720">720p (1280x720)</SelectItem>
                      <SelectItem value="1920x1080">1080p (1920x1080)</SelectItem>
                      <SelectItem value="2560x1440">1440p (2560x1440)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || createProjectMutation.isPending}
                  data-testid="button-create-project"
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Avatar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-background">
        <div className="container mx-auto p-6 max-w-6xl">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading avatars...
            </div>
          ) : !projects || projects.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Avatars Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first virtual avatar to get started
              </p>
              <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-avatar">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Avatar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Your Avatars</h2>
                  <p className="text-sm text-muted-foreground">
                    {projects.length} {projects.length === 1 ? "avatar" : "avatars"} ready for streaming
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="hover-elevate cursor-pointer active-elevate-2"
                    onClick={() => setLocation(`/project/${project.id}`)}
                    data-testid={`card-project-${project.id}`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate">{project.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteProject(e, project.id)}
                          data-testid={`button-delete-${project.id}`}
                          className="shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        {project.fps} FPS • {project.resolution}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Rest Position:</span>
                          <span className={project.restPositionClipUrl ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                            {project.restPositionClipUrl ? "✓ Uploaded" : "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Background:</span>
                          <span className={project.backgroundImageUrl ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                            {project.backgroundImageUrl ? "✓ Set" : "Not set"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Training Audio:</span>
                          <span className={project.trainingAudioUrl ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                            {project.trainingAudioUrl ? "✓ Recorded" : "Not recorded"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/project/${project.id}`);
                        }}
                        data-testid={`button-open-${project.id}`}
                      >
                        Open Avatar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
