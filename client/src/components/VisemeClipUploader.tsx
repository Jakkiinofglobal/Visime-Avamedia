import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Film, Plus, Check, Star } from "lucide-react";
import { getVisemeMap, VisemeClip, Project } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VisemeClipUploaderProps {
  onContinue?: () => void;
  projectId?: string;
}

export default function VisemeClipUploader({ onContinue, projectId }: VisemeClipUploaderProps) {
  const { toast } = useToast();

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: clips = [] } = useQuery<VisemeClip[]>({
    queryKey: ["/api/projects", projectId, "clips"],
    enabled: !!projectId,
  });

  // Get the correct viseme map based on project complexity
  const visemeMap = project ? getVisemeMap(project.visemeComplexity) : getVisemeMap(3);

  const uploadClipMutation = useMutation({
    mutationFn: async ({ visemeId, file, variantIndex }: { visemeId: string; file: File; variantIndex: number }) => {
      const formData = new FormData();
      formData.append("video", file);
      formData.append("visemeId", visemeId);
      formData.append("variantIndex", variantIndex.toString());
      
      const response = await fetch(`/api/projects/${projectId}/clips`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clip uploaded",
        description: "Video clip added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clips"] });
    },
  });

  const deleteClipMutation = useMutation({
    mutationFn: async (clipId: string) => {
      const response = await fetch(`/api/clips/${clipId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clips"] });
    },
  });

  const uploadRestPositionMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
      
      const response = await fetch(`/api/projects/${projectId}/rest-position`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rest position uploaded",
        description: "Avatar rest position video uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  const setRestPoseMutation = useMutation({
    mutationFn: async (clipUrl: string) => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, {
        restPositionClipUrl: clipUrl,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rest pose set",
        description: "This clip will be used as the default rest position",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  const removeRestPositionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, {
        restPositionClipUrl: null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rest position removed",
        description: "Rest position has been cleared",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  const handleFileSelect = (visemeId: string, file: File) => {
    if (!projectId) return;
    
    const existingClips = clips.filter(c => c.visemeId === visemeId);
    const variantIndex = existingClips.length;
    
    uploadClipMutation.mutate({ visemeId, file, variantIndex });
  };

  const handleRemove = (clipId: string) => {
    deleteClipMutation.mutate(clipId);
  };

  const clipsByViseme = clips.reduce((acc, clip) => {
    if (!acc[clip.visemeId]) acc[clip.visemeId] = [];
    acc[clip.visemeId].push(clip);
    return acc;
  }, {} as Record<string, VisemeClip[]>);

  const totalClips = clips.length;
  const visemesWithClips = Object.keys(clipsByViseme).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rest Position</CardTitle>
          <CardDescription>
            Upload a video clip showing your avatar in its default resting state (no speech)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!project?.restPositionClipUrl ? (
            <>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadRestPositionMutation.mutate(file);
                }}
                className="hidden"
                id="upload-rest-position"
                data-testid="input-upload-rest-position"
              />
              <label htmlFor="upload-rest-position">
                <div
                  className="w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-3 hover-elevate active-elevate-2 transition-colors cursor-pointer"
                  data-testid="button-upload-rest-position"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <div className="text-center">
                    <div className="text-sm font-medium">Upload rest position clip</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      This will be shown when not speaking
                    </div>
                  </div>
                </div>
              </label>
            </>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
              <div className="w-10 h-10 rounded-full bg-chart-2/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-chart-2" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Rest position uploaded</div>
                <div className="text-xs text-muted-foreground">Avatar will return to this state when idle</div>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadRestPositionMutation.mutate(file);
                  }}
                  className="hidden"
                  id="replace-rest-position"
                  data-testid="input-replace-rest-position"
                />
                <label htmlFor="replace-rest-position">
                  <Button variant="outline" size="sm" asChild data-testid="button-replace-rest-position">
                    <span>Replace</span>
                  </Button>
                </label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => removeRestPositionMutation.mutate()}
                  data-testid="button-remove-rest-position"
                >
                  <X className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle>Upload Viseme Clips</CardTitle>
              <CardDescription>
                Upload green-screen video clips for each mouth shape (viseme)
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{totalClips}</div>
              <div className="text-xs text-muted-foreground">clips uploaded</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(visemeMap).map(([visemeId, data]) => {
              const visemeClips = clipsByViseme[visemeId] || [];
              const visemeData = data as { label: string; phonemes: readonly string[]; color: string; example?: string };
              
              return (
                <Card key={visemeId} className="overflow-hidden" data-testid={`viseme-card-${visemeId}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-mono text-sm font-bold">{visemeId}</div>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: visemeData.color,
                          color: visemeData.color,
                        }}
                      >
                        {visemeData.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {visemeData.example || visemeData.phonemes.join(", ")}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {visemeClips.length === 0 ? (
                      <>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(visemeId, file);
                          }}
                          className="hidden"
                          id={`upload-${visemeId}`}
                          data-testid={`input-upload-${visemeId}`}
                        />
                        <label htmlFor={`upload-${visemeId}`}>
                          <div
                            className="w-full h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 hover-elevate active-elevate-2 transition-colors cursor-pointer"
                            data-testid={`button-upload-${visemeId}`}
                          >
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Upload clip</span>
                          </div>
                        </label>
                      </>
                    ) : (
                      <div className="space-y-2">
                        {visemeClips.map((clip, idx) => (
                          <div
                            key={clip.id}
                            className="flex items-center gap-2 p-2 bg-muted rounded-md"
                            data-testid={`clip-${visemeId}-${idx}`}
                          >
                            <Film className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate flex items-center gap-1">
                                Variant {idx + 1}
                                {project?.restPositionClipUrl === clip.clipUrl && (
                                  <Star className="w-3 h-3 text-chart-3 fill-chart-3" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {(clip.duration / 1000).toFixed(2)}s
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => setRestPoseMutation.mutate(clip.clipUrl)}
                              disabled={project?.restPositionClipUrl === clip.clipUrl}
                              data-testid={`button-set-rest-${visemeId}-${idx}`}
                            >
                              <Star className="w-3 h-3 mr-1" />
                              Rest
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => handleRemove(clip.id)}
                              data-testid={`button-remove-${visemeId}-${idx}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(visemeId, file);
                          }}
                          className="hidden"
                          id={`upload-variant-${visemeId}`}
                          data-testid={`input-upload-variant-${visemeId}`}
                        />
                        <label htmlFor={`upload-variant-${visemeId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            asChild
                            data-testid={`button-add-variant-${visemeId}`}
                          >
                            <span>
                              <Plus className="w-3 h-3 mr-2" />
                              Add Variant
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-6 mt-6 border-t">
            <div className="text-sm text-muted-foreground">
              {visemesWithClips} of {Object.keys(visemeMap).length} visemes have clips
            </div>
            <Button
              size="lg"
              onClick={onContinue}
              disabled={totalClips === 0}
              data-testid="button-continue-test"
            >
              Continue to Test & Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
