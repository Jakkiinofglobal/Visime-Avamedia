import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { PhonemeSegment, VISEME_MAP, VisemeId } from "@shared/schema";

interface PhonemeTimelineProps {
  segments?: PhonemeSegment[];
  duration?: number;
  onContinue?: () => void;
}

export default function PhonemeTimeline({ segments, duration = 3.2, onContinue }: PhonemeTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log(isPlaying ? "Paused" : "Playing");
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
    console.log("Seeking to:", value[0]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phoneme Alignment</CardTitle>
          <CardDescription>
            Review the automatic phoneme-to-viseme mapping for your training sentence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative h-24 bg-muted rounded-md overflow-hidden">
            {segments?.map((segment, idx) => {
              const left = (segment.start / duration) * 100;
              const width = ((segment.end - segment.start) / duration) * 100;
              const visemeData = VISEME_MAP[segment.viseme as VisemeId];
              
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
              {Array.from(new Set(segments?.map(s => s.viseme) || [])).map((viseme) => {
                const visemeData = VISEME_MAP[viseme as VisemeId];
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

          <Button
            size="lg"
            className="w-full"
            onClick={onContinue}
            data-testid="button-continue-clips"
          >
            Continue to Upload Clips
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
