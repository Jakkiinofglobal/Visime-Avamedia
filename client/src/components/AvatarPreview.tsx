import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Square, Play, Download, Copy } from "lucide-react";
import { VISEME_MAP } from "@shared/schema";

interface AvatarPreviewProps {
  onExport?: () => void;
}

export default function AvatarPreview({ onExport }: AvatarPreviewProps) {
  const [testText, setTestText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [greenScreen, setGreenScreen] = useState(true);
  const [currentViseme, setCurrentViseme] = useState("V2");
  const [latency, setLatency] = useState(380);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isRecording || isProcessing) {
      const interval = setInterval(() => {
        const visemes = Object.keys(VISEME_MAP);
        setCurrentViseme(visemes[Math.floor(Math.random() * visemes.length)]);
        setLatency(Math.floor(Math.random() * 200) + 300);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isRecording, isProcessing]);

  const handleMicToggle = () => {
    setIsRecording(!isRecording);
    console.log(isRecording ? "Stopped recording" : "Started recording");
  };

  const handleTextProcess = () => {
    if (!testText.trim()) return;
    setIsProcessing(true);
    console.log("Processing text:", testText);
    setTimeout(() => {
      setIsProcessing(false);
      console.log("Text processing complete");
    }, 3000);
  };

  const handleCopyUrl = () => {
    const url = "http://localhost:5000/stream/avatar-preview";
    navigator.clipboard.writeText(url);
    console.log("Copied browser source URL");
  };

  const getLatencyColor = () => {
    if (latency < 300) return "hsl(var(--chart-2))";
    if (latency < 500) return "hsl(var(--chart-3))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Video Preview</CardTitle>
            <CardDescription>Real-time avatar output</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video rounded-md overflow-hidden border-2" style={{
              backgroundColor: greenScreen ? "#00FF00" : "transparent",
            }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                data-testid="canvas-preview"
              />
              
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="font-mono text-xs bg-background/80 backdrop-blur"
                  data-testid="badge-current-viseme"
                >
                  {currentViseme}
                </Badge>
                {(isRecording || isProcessing) && (
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                )}
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-background/80 backdrop-blur">
                  <div className="text-xs font-medium">Latency:</div>
                  <div
                    className="text-xs font-mono font-bold"
                    style={{ color: getLatencyColor() }}
                    data-testid="text-latency"
                  >
                    {latency}ms
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-md">
              <Label htmlFor="green-screen" className="text-sm cursor-pointer" data-testid="label-green-screen">
                Green Screen Background
              </Label>
              <Switch
                id="green-screen"
                checked={greenScreen}
                onCheckedChange={setGreenScreen}
                data-testid="switch-green-screen"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Browser Source URL (for OBS)</Label>
              <div className="flex gap-2">
                <Input
                  value="http://localhost:5000/stream/avatar-preview"
                  readOnly
                  className="font-mono text-xs"
                  data-testid="input-browser-source-url"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  data-testid="button-copy-url"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Input</CardTitle>
              <CardDescription>Test your avatar with text or microphone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-text" data-testid="label-test-text">Type Text to Test</Label>
                <Input
                  id="test-text"
                  data-testid="input-test-text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to convert to visemes..."
                  onKeyDown={(e) => e.key === 'Enter' && handleTextProcess()}
                />
                <Button
                  className="w-full"
                  onClick={handleTextProcess}
                  disabled={!testText.trim() || isProcessing}
                  data-testid="button-process-text"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isProcessing ? "Processing..." : "Process Text"}
                </Button>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className="w-full"
                onClick={handleMicToggle}
                data-testid="button-toggle-mic"
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Live Microphone
                  </>
                )}
              </Button>

              {isRecording && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="text-sm font-medium text-destructive mb-2">🔴 Live</div>
                  <div className="text-xs text-muted-foreground">
                    Speak into your microphone to see real-time viseme sequencing
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export</CardTitle>
              <CardDescription>Save your avatar configuration or export video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={onExport}
                data-testid="button-export-config"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Configuration
              </Button>
              <Button
                variant="outline"
                className="w-full"
                data-testid="button-export-video"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Test Video (MP4)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Visemes Stream</CardTitle>
          <CardDescription>Real-time phoneme detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(VISEME_MAP).map(([id, data]) => (
              <Badge
                key={id}
                variant={currentViseme === id ? "default" : "outline"}
                className="font-mono transition-all"
                style={currentViseme === id ? {
                  backgroundColor: data.color,
                  borderColor: data.color,
                  color: "hsl(var(--primary-foreground))",
                } : {
                  borderColor: data.color,
                  color: data.color,
                }}
                data-testid={`viseme-indicator-${id}`}
              >
                {id}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
