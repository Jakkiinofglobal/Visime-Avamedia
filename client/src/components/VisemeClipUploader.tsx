import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Film, Plus } from "lucide-react";
import { VISEME_MAP, VisemeId, VisemeClip } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VisemeClipUploaderProps {
  onContinue?: () => void;
  projectId?: string;
}

export default function VisemeClipUploader({ onContinue, projectId }: VisemeClipUploaderProps) {
  const { toast } = useToast();

  const { data: clips = [] } = useQuery<VisemeClip[]>({
    queryKey: ["/api/projects", projectId, "clips"],
    enabled: !!projectId,
  });

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
            {Object.entries(VISEME_MAP).map(([visemeId, data]) => {
              const visemeClips = clipsByViseme[visemeId] || [];
              
              return (
                <Card key={visemeId} className="overflow-hidden" data-testid={`viseme-card-${visemeId}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-mono text-sm font-bold">{visemeId}</div>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: data.color,
                          color: data.color,
                        }}
                      >
                        {data.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      /{data.phonemes.join(", ")}/
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
                              <div className="text-xs font-medium truncate">Variant {idx + 1}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {(clip.duration / 1000).toFixed(2)}s
                              </div>
                            </div>
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
              {visemesWithClips} of {Object.keys(VISEME_MAP).length} visemes have clips
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
