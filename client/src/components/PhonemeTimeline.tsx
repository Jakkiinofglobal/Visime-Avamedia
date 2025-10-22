import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Upload } from "lucide-react";
import { PhonemeSegment, getVisemeMap, Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PhonemeTimelineProps {
  segments?: PhonemeSegment[];
  duration?: number;
  onContinue?: () => void;
  projectId?: string;
  project?: Project;
  onProjectUpdate?: (project: Project) => void;
}

export default function PhonemeTimeline({ segments, duration = 3.2, onContinue, projectId, project, onProjectUpdate }: PhonemeTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const visemeMap = getVisemeMap(project?.visemeComplexity || 3);

  const uploadAudioMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("audio", file);
      
      const response = await fetch(`/api/projects/${projectId}/training-audio`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Audio uploaded",
        description: "Phoneme alignment complete",
      });
      if (data.project && onProjectUpdate) {
        onProjectUpdate(data.project);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && projectId) {
      uploadAudioMutation.mutate(file);
    }
  };

  // Initialize audio element when training audio URL is available
  useEffect(() => {
    if (project?.trainingAudioUrl && !audioRef.current) {
      const audio = new Audio(project.trainingAudioUrl);
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener('loadedmetadata', () => {
        // Update duration from actual audio if different
        console.log('Audio loaded, duration:', audio.duration);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [project?.trainingAudioUrl]);

  // Sync currentTime with audio playback
  useEffect(() => {
    const updateTime = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phoneme Alignment</CardTitle>
          <CardDescription>
            {segments ? "Review the automatic phoneme-to-viseme mapping" : "Upload training audio for alignment"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!segments && (
            <div className="text-center py-8">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
                data-testid="input-audio-upload"
              />
              <label htmlFor="audio-upload">
                <Button asChild data-testid="button-upload-audio">
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Training Audio
                  </span>
                </Button>
              </label>
            </div>
          )}

          {segments && (
            <>
              <div className="relative h-24 bg-muted rounded-md overflow-hidden">
                {segments.map((segment, idx) => {
                  const left = (segment.start / duration) * 100;
                  const width = ((segment.end - segment.start) / duration) * 100;
                  const visemeData = visemeMap[segment.viseme as keyof typeof visemeMap] as { label: string; phonemes: readonly string[]; color: string; example?: string } | undefined;
                  
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-r border-background flex items-center justify-center text-xs font-mono font-medium overflow-hidden hover-elevate"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: visemeData?.color || "hsl(var(--muted))",
                        color: "hsl(var(--primary-foreground))",
                      }}
                      data-testid={`segment-${segment.viseme}`}
                    >
                      <span className="truncate px-1">{segment.viseme}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-muted-foreground min-w-16">
                    {currentTime.toFixed(2)}s
                  </span>
                  <Slider
                    value={[currentTime]}
                    onValueChange={handleSeek}
                    max={duration}
                    step={0.01}
                    className="flex-1"
                    data-testid="slider-timeline"
                  />
                  <span className="text-sm font-mono text-muted-foreground min-w-16">
                    {duration.toFixed(2)}s
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentTime(0)}
                    data-testid="button-skip-back"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handlePlayPause}
                    data-testid="button-play-pause"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentTime(duration)}
                    data-testid="button-skip-forward"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Detected Visemes</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(segments.map(s => s.viseme))).map((viseme) => {
                    const visemeData = visemeMap[viseme as keyof typeof visemeMap] as { label: string; phonemes: readonly string[]; color: string; example?: string } | undefined;
                    return (
                      <div
                        key={viseme}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono"
                        style={{
                          backgroundColor: visemeData?.color || "hsl(var(--muted))",
                          color: "hsl(var(--primary-foreground))",
                        }}
                        data-testid={`viseme-badge-${viseme}`}
                      >
                        {viseme}: {visemeData?.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={onContinue}
            disabled={!segments}
            data-testid="button-continue-clips"
          >
            Continue to Upload Clips
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
