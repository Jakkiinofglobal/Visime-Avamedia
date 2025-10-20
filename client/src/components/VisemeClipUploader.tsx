import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Film, Plus } from "lucide-react";
import { VISEME_MAP, VisemeId } from "@shared/schema";

interface ClipData {
  id: string;
  file: string;
  duration: number;
}

interface VisemeClipUploaderProps {
  onContinue?: () => void;
}

export default function VisemeClipUploader({ onContinue }: VisemeClipUploaderProps) {
  const [clips, setClips] = useState<Record<string, ClipData[]>>({});

  const handleUpload = (visemeId: string) => {
    const newClip: ClipData = {
      id: Math.random().toString(36).substr(2, 9),
      file: `clip-${visemeId}-${Date.now()}.mp4`,
      duration: Math.random() * 0.8 + 0.4,
    };
    
    setClips(prev => ({
      ...prev,
      [visemeId]: [...(prev[visemeId] || []), newClip],
    }));
    
    console.log(`Uploaded clip for ${visemeId}`, newClip);
  };

  const handleRemove = (visemeId: string, clipId: string) => {
    setClips(prev => ({
      ...prev,
      [visemeId]: prev[visemeId].filter(c => c.id !== clipId),
    }));
    console.log(`Removed clip ${clipId} from ${visemeId}`);
  };

  const totalClips = Object.values(clips).reduce((sum, arr) => sum + arr.length, 0);
  const visemesWithClips = Object.keys(clips).filter(k => clips[k].length > 0).length;

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
              const visemeClips = clips[visemeId] || [];
              
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
                      <button
                        onClick={() => handleUpload(visemeId)}
                        className="w-full h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 hover-elevate active-elevate-2 transition-colors"
                        data-testid={`button-upload-${visemeId}`}
                      >
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload clip</span>
                      </button>
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
                                {clip.duration.toFixed(2)}s
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={() => handleRemove(visemeId, clip.id)}
                              data-testid={`button-remove-${visemeId}-${idx}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleUpload(visemeId)}
                          data-testid={`button-add-variant-${visemeId}`}
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          Add Variant
                        </Button>
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
