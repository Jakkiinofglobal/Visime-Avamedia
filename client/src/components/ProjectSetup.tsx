import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Square, Loader2 } from "lucide-react";

interface ProjectSetupProps {
  onComplete?: (config: { name: string; fps: number; resolution: string; visemeComplexity: number }) => void;
}

export default function ProjectSetup({ onComplete }: ProjectSetupProps) {
  const [projectName, setProjectName] = useState("My Avatar Project");
  const [fps, setFps] = useState("30");
  const [resolution, setResolution] = useState("1920x1080");
  const [visemeComplexity, setVisemeComplexity] = useState("3");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  const handleRecord = () => {
    setIsRecording(true);
    console.log("Recording started");
    setTimeout(() => {
      setIsRecording(false);
      setHasRecording(true);
      console.log("Recording completed");
    }, 3000);
  };

  const handleContinue = () => {
    console.log("Project setup complete", { projectName, fps, resolution, visemeComplexity });
    onComplete?.({ name: projectName, fps: parseInt(fps), resolution, visemeComplexity: parseInt(visemeComplexity) });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Configuration</CardTitle>
          <CardDescription>Set up your avatar project parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name" data-testid="label-project-name">Project Name</Label>
            <Input
              id="project-name"
              data-testid="input-project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fps" data-testid="label-fps">Frame Rate (FPS)</Label>
              <Select value={fps} onValueChange={setFps}>
                <SelectTrigger id="fps" data-testid="select-fps">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 FPS</SelectItem>
                  <SelectItem value="30">30 FPS (Recommended)</SelectItem>
                  <SelectItem value="60">60 FPS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution" data-testid="label-resolution">Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger id="resolution" data-testid="select-resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1920×1080 (Full HD)</SelectItem>
                  <SelectItem value="1280x720">1280×720 (HD)</SelectItem>
                  <SelectItem value="3840x2160">3840×2160 (4K)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complexity" data-testid="label-complexity">Viseme Complexity</Label>
            <Select value={visemeComplexity} onValueChange={setVisemeComplexity}>
              <SelectTrigger id="complexity" data-testid="select-complexity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Visemes (Simple - Baa, Maa, Ohh)</SelectItem>
                <SelectItem value="9">9 Visemes (Medium Detail)</SelectItem>
                <SelectItem value="14">14 Visemes (Full Detail)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how many mouth shapes to record. 3 is fastest, 14 is most realistic.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training Sentence</CardTitle>
          <CardDescription>
            Record yourself saying a training sentence for phoneme alignment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-mono text-muted-foreground mb-2">Recommended sentence:</p>
            <p className="font-medium">"The quick brown fox jumps over the lazy dog."</p>
          </div>

          {!hasRecording ? (
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="w-full"
              onClick={handleRecord}
              disabled={isRecording}
              data-testid="button-record-training"
            >
              {isRecording ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-chart-2/10 border border-chart-2/20 rounded-md">
                <div className="w-2 h-2 rounded-full bg-chart-2" />
                <span className="text-sm font-medium">Recording complete (3.2s)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHasRecording(false)}
                data-testid="button-re-record"
              >
                Re-record
              </Button>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handleContinue}
            disabled={!hasRecording}
            data-testid="button-continue-setup"
          >
            Continue to Phoneme Alignment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
