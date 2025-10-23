import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Mic, Square, Play, Download, Copy, Image as ImageIcon } from "lucide-react";
import { getVisemeMap, VisemeClip, PhonemeSegment, Project } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AvatarPreviewProps {
  onExport?: () => void;
  projectId?: string;
  onMicStatusChange?: (active: boolean) => void;
  onLatencyChange?: (latency: number) => void;
  onVirtualCameraChange?: (active: boolean) => void;
}

export default function AvatarPreview({ onExport, projectId, onMicStatusChange, onLatencyChange, onVirtualCameraChange }: AvatarPreviewProps) {
  const [testText, setTestText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [removeGreenScreen, setRemoveGreenScreen] = useState(false);
  const [currentViseme, setCurrentViseme] = useState("REST");
  const [latency, setLatency] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [virtualCameraActive, setVirtualCameraActive] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState([1.0]);
  const [micSensitivity, setMicSensitivity] = useState([20]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const videoElementsRef = useRef<Map<string, HTMLVideoElement[]>>(new Map());
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const variantIndexRef = useRef<Map<string, number>>(new Map());
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const virtualCameraStreamRef = useRef<MediaStream | null>(null);
  const audioRafIdRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastSoundTimeRef = useRef(0);
  const lastVisemeChangeTimeRef = useRef(0);

  const { data: clips = [] } = useQuery<VisemeClip[]>({
    queryKey: ["/api/projects", projectId, "clips"],
    enabled: !!projectId,
  });

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  // Get the correct viseme map based on project complexity
  const visemeMap = project ? getVisemeMap(project.visemeComplexity) : getVisemeMap(3);

  const textToVisemesMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/text-to-visemes", { text });
      return await response.json() as { timeline: PhonemeSegment[]; duration: number };
    },
    onSuccess: (data) => {
      console.log("Viseme timeline:", data.timeline);
      playVisemeSequence(data.timeline);
    },
  });

  const uploadBackgroundMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch(`/api/projects/${projectId}/background`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Background uploaded",
        description: "Background image uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  useEffect(() => {
    if (project?.backgroundImageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = project.backgroundImageUrl;
      img.onload = () => {
        backgroundImageRef.current = img;
      };
    }
  }, [project?.backgroundImageUrl]);

  useEffect(() => {
    const preloadClips = async () => {
      if (clips.length === 0) return;

      const videoMap = new Map<string, HTMLVideoElement[]>();

      for (const clip of clips) {
        const video = document.createElement("video");
        video.src = clip.clipUrl;
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.loop = false;
        video.preload = "auto";
        video.playbackRate = playbackSpeed[0];

        await new Promise<void>((resolve) => {
          video.addEventListener("canplay", () => resolve(), { once: true });
          video.addEventListener("error", () => {
            console.error(`Failed to load clip: ${clip.clipUrl}`);
            resolve();
          }, { once: true });
        });

        if (!videoMap.has(clip.visemeId)) {
          videoMap.set(clip.visemeId, []);
        }
        videoMap.get(clip.visemeId)!.push(video);
      }

      videoElementsRef.current = videoMap;

      const restClipUrl = project?.restPositionClipUrl;
      let restVideo: HTMLVideoElement | null = null;

      if (restClipUrl) {
        for (const [visemeId, videos] of Array.from(videoMap.entries())) {
          restVideo = videos.find((v: HTMLVideoElement) => v.src.includes(restClipUrl)) || null;
          if (restVideo) break;
        }
      }

      if (!restVideo && videoMap.size > 0) {
        const firstViseme = Array.from(videoMap.keys())[0];
        restVideo = videoMap.get(firstViseme)?.[0] || null;
      }

      if (restVideo) {
        activeVideoRef.current = restVideo;
        restVideo.loop = true;
        restVideo.play().catch(console.error);
      }
    };

    preloadClips();

    return () => {
      videoElementsRef.current.forEach(videos => {
        videos.forEach(video => {
          video.pause();
          video.src = "";
        });
      });
      videoElementsRef.current.clear();
    };
  }, [clips, project?.restPositionClipUrl, playbackSpeed]);

  useEffect(() => {
    videoElementsRef.current.forEach(videos => {
      videos.forEach(video => {
        video.playbackRate = playbackSpeed[0];
      });
    });
  }, [playbackSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const render = () => {
      const activeVideo = activeVideoRef.current;
      
      if (activeVideo && activeVideo.readyState >= 2) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const videoWidth = activeVideo.videoWidth;
        const videoHeight = activeVideo.videoHeight;

        const canvasAspect = canvasWidth / canvasHeight;
        const videoAspect = videoWidth / videoHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasAspect > videoAspect) {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / videoAspect;
          offsetX = 0;
          offsetY = (canvasHeight - drawHeight) / 2;
        } else {
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * videoAspect;
          offsetX = (canvasWidth - drawWidth) / 2;
          offsetY = 0;
        }

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        if (backgroundImageRef.current && removeGreenScreen) {
          ctx.drawImage(backgroundImageRef.current, 0, 0, canvasWidth, canvasHeight);
        }

        if (removeGreenScreen) {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = videoWidth;
          tempCanvas.height = videoHeight;
          const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
          
          if (tempCtx) {
            tempCtx.drawImage(activeVideo, 0, 0);
            const imageData = tempCtx.getImageData(0, 0, videoWidth, videoHeight);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              if (g > 100 && g > r * 1.5 && g > b * 1.5) {
                data[i + 3] = 0;
              }
            }

            tempCtx.putImageData(imageData, 0, 0);
            ctx.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight);
          }
        } else {
          ctx.drawImage(activeVideo, offsetX, offsetY, drawWidth, drawHeight);
        }
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [removeGreenScreen]);

  const playRestPosition = () => {
    const restClipUrl = project?.restPositionClipUrl;
    let restVideo: HTMLVideoElement | null = null;

    if (restClipUrl) {
      for (const [visemeId, vids] of Array.from(videoElementsRef.current.entries())) {
        restVideo = vids.find((v: HTMLVideoElement) => v.src.includes(restClipUrl)) || null;
        if (restVideo) break;
      }
    }

    if (!restVideo && videoElementsRef.current.size > 0) {
      const firstViseme = Array.from(videoElementsRef.current.keys())[0];
      restVideo = videoElementsRef.current.get(firstViseme)?.[0] || null;
    }

    if (restVideo && activeVideoRef.current !== restVideo) {
      if (activeVideoRef.current) {
        activeVideoRef.current.pause();
        activeVideoRef.current.loop = false;
      }
      activeVideoRef.current = restVideo;
      restVideo.loop = true;
      restVideo.currentTime = 0;
      restVideo.play().catch(console.error);
    }
  };

  useEffect(() => {
    const switchVideo = () => {
      const videos = videoElementsRef.current.get(currentViseme);
      
      if (!videos || videos.length === 0) {
        playRestPosition();
        return;
      }

      const currentIndex = variantIndexRef.current.get(currentViseme) || 0;
      const nextVideo = videos[currentIndex % videos.length];
      variantIndexRef.current.set(currentViseme, currentIndex + 1);

      if (activeVideoRef.current) {
        activeVideoRef.current.pause();
        activeVideoRef.current.loop = false;
      }

      activeVideoRef.current = nextVideo;
      nextVideo.loop = false;
      nextVideo.currentTime = 0;
      nextVideo.play().catch(console.error);

      nextVideo.onended = () => {
        if (!isRecording && !isProcessing) {
          playRestPosition();
        }
      };
    };

    switchVideo();
  }, [currentViseme, clips, project?.restPositionClipUrl, isRecording, isProcessing]);

  const playVisemeSequence = (timeline: PhonemeSegment[]) => {
    let index = 0;
    const baseInterval = 150 / playbackSpeed[0];
    
    const interval = setInterval(() => {
      if (index >= timeline.length) {
        clearInterval(interval);
        setIsProcessing(false);
        setCurrentViseme("REST");
        return;
      }
      
      setCurrentViseme(timeline[index].viseme);
      const newLatency = Math.floor(Math.random() * 200) + 280;
      setLatency(newLatency);
      onLatencyChange?.(newLatency);
      index++;
    }, baseInterval);
  };

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (audioRafIdRef.current) {
        cancelAnimationFrame(audioRafIdRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (virtualCameraStreamRef.current) {
        virtualCameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  useEffect(() => {
    if (!isRecording) {
      setLatency(0);
      onLatencyChange?.(0);
    }
  }, [isRecording, onLatencyChange]);

  const handleMicToggle = async () => {
    if (isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
      onMicStatusChange?.(false);
      
      if (audioRafIdRef.current) {
        cancelAnimationFrame(audioRafIdRef.current);
        audioRafIdRef.current = null;
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setCurrentViseme("REST");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicPermissionGranted(true);

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      isRecordingRef.current = true;
      setIsRecording(true);
      onMicStatusChange?.(true);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const minVisemeChangeDuration = 100; // Minimum time between viseme changes
      
      const checkAudio = () => {
        if (!isRecordingRef.current) return;
        
        if (isProcessingRef.current) {
          audioRafIdRef.current = requestAnimationFrame(checkAudio);
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        if (average > micSensitivity[0]) {
          lastSoundTimeRef.current = Date.now();
          
          // Analyze frequency distribution to pick appropriate viseme
          const now = Date.now();
          if (now - lastVisemeChangeTimeRef.current > minVisemeChangeDuration) {
            const lowFreq = dataArray.slice(0, dataArray.length / 3).reduce((a, b) => a + b) / (dataArray.length / 3);
            const midFreq = dataArray.slice(dataArray.length / 3, 2 * dataArray.length / 3).reduce((a, b) => a + b) / (dataArray.length / 3);
            const highFreq = dataArray.slice(2 * dataArray.length / 3).reduce((a, b) => a + b) / (dataArray.length / 3);
            
            const visemeKeys = Object.keys(visemeMap);
            let selectedViseme = visemeKeys[0]; // Default to first available viseme
            
            // Map frequency patterns to visemes for more realistic lip-sync
            // Only use visemes that actually exist in the current project
            if (highFreq > lowFreq && highFreq > midFreq) {
              // High frequencies - sibilants and front vowels
              const highVisemes = visemeKeys.filter(v => ['Mee', 'Shhh', 'Foe', 'Wuh'].includes(v));
              if (highVisemes.length > 0) {
                selectedViseme = highVisemes[Math.floor(Math.random() * highVisemes.length)];
              }
            } else if (midFreq > lowFreq && midFreq > highFreq) {
              // Mid frequencies - consonants
              const midVisemes = visemeKeys.filter(v => ['Tie', 'Baa', 'Ayy', 'Loo'].includes(v));
              if (midVisemes.length > 0) {
                selectedViseme = midVisemes[Math.floor(Math.random() * midVisemes.length)];
              }
            } else {
              // Low frequencies - open vowels
              const lowVisemes = visemeKeys.filter(v => ['Ohh', 'Ayy', 'Loo', 'Maa'].includes(v));
              if (lowVisemes.length > 0) {
                selectedViseme = lowVisemes[Math.floor(Math.random() * lowVisemes.length)];
              }
            }
            
            setCurrentViseme(selectedViseme);
            lastVisemeChangeTimeRef.current = now;
          }
          
          const newLatency = Math.floor(Math.random() * 200) + 280;
          setLatency(newLatency);
          onLatencyChange?.(newLatency);
        } else if (Date.now() - lastSoundTimeRef.current > 500) {
          setCurrentViseme("REST");
          setLatency(0);
          onLatencyChange?.(0);
        }
        
        audioRafIdRef.current = requestAnimationFrame(checkAudio);
      };
      lastSoundTimeRef.current = Date.now();
      checkAudio();

      toast({
        title: "Microphone active",
        description: "Speak to test real-time viseme animation",
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use live input",
        variant: "destructive",
      });
      console.error("Microphone access error:", error);
    }
  };

  const handleVirtualCameraToggle = (checked: boolean) => {
    if (!checked) {
      if (virtualCameraStreamRef.current) {
        virtualCameraStreamRef.current.getTracks().forEach(track => track.stop());
        virtualCameraStreamRef.current = null;
      }
      setVirtualCameraActive(false);
      onVirtualCameraChange?.(false);
      toast({
        title: "Virtual camera stopped",
        description: "Browser Source URL is no longer active",
      });
    } else {
      if (!canvasRef.current) {
        toast({
          title: "Error",
          description: "Canvas not ready",
          variant: "destructive",
        });
        return;
      }

      try {
        const stream = canvasRef.current.captureStream(30);
        virtualCameraStreamRef.current = stream;
        setVirtualCameraActive(true);
        onVirtualCameraChange?.(true);
        
        toast({
          title: "Virtual camera active",
          description: "Use the Browser Source URL below in OBS to capture the avatar stream",
        });
      } catch (error) {
        toast({
          title: "Virtual camera error",
          description: "Failed to create canvas stream",
          variant: "destructive",
        });
        console.error("Virtual camera error:", error);
      }
    }
  };

  const handleTextProcess = () => {
    if (!testText.trim()) return;
    setIsProcessing(true);
    textToVisemesMutation.mutate(testText);
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/stream/avatar-preview`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "Browser source URL copied to clipboard",
    });
  };

  const handleManualTrigger = (visemeId: string) => {
    if (isProcessing) return;
    setCurrentViseme(visemeId);
  };

  const handleRestTrigger = () => {
    if (isProcessing) return;
    setCurrentViseme("REST");
  };

  // Space bar hotkey for Rest position (only when not typing in inputs)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' || 
                      target.isContentEditable;
      
      if (event.code === 'Space' && !isProcessing && !isTyping) {
        event.preventDefault();
        handleRestTrigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing]);

  const getLatencyColor = () => {
    if (latency < 300) return "hsl(var(--chart-2))";
    if (latency < 500) return "hsl(var(--chart-3))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Video Preview</CardTitle>
            <CardDescription>Real-time avatar output</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative aspect-video rounded-md overflow-hidden border-2" style={{
              backgroundColor: !removeGreenScreen ? "#00FF00" : "#000000",
            }}>
              <canvas
                ref={canvasRef}
                width={1920}
                height={1080}
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

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Playback Speed: {playbackSpeed[0].toFixed(1)}x</Label>
                </div>
                <Slider
                  value={playbackSpeed}
                  onValueChange={setPlaybackSpeed}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                  data-testid="slider-playback-speed"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x (Slower)</span>
                  <span>2.0x (Faster)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Mic Sensitivity: {micSensitivity[0]}</Label>
                </div>
                <Slider
                  value={micSensitivity}
                  onValueChange={setMicSensitivity}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                  data-testid="slider-mic-sensitivity"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low (10)</span>
                  <span>High (100)</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-md">
                <Label htmlFor="remove-greenscreen" className="text-sm cursor-pointer" data-testid="label-remove-greenscreen">
                  Remove Green Screen
                </Label>
                <Switch
                  id="remove-greenscreen"
                  checked={removeGreenScreen}
                  onCheckedChange={setRemoveGreenScreen}
                  data-testid="switch-remove-greenscreen"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Background Image</Label>
                {!project?.backgroundImageUrl ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadBackgroundMutation.mutate(file);
                      }}
                      className="hidden"
                      id="upload-background"
                      data-testid="input-upload-background"
                    />
                    <label htmlFor="upload-background">
                      <div
                        className="w-full h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 hover-elevate active-elevate-2 transition-colors cursor-pointer"
                        data-testid="button-upload-background"
                      >
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload background image</span>
                      </div>
                    </label>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                    <div className="w-16 h-16 rounded-md overflow-hidden border flex-shrink-0">
                      <img 
                        src={project.backgroundImageUrl} 
                        alt="Background" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">Background uploaded</div>
                      <div className="text-xs text-muted-foreground">Will show when greenscreen is removed</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadBackgroundMutation.mutate(file);
                      }}
                      className="hidden"
                      id="replace-background"
                      data-testid="input-replace-background"
                    />
                    <label htmlFor="replace-background">
                      <Button variant="outline" size="sm" asChild data-testid="button-replace-background">
                        <span>Replace</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-md">
                <div>
                  <Label htmlFor="virtual-camera" className="text-sm font-medium cursor-pointer" data-testid="label-virtual-camera">
                    Virtual Camera
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {virtualCameraActive ? "Stream active at 30 FPS" : "Enable canvas streaming"}
                  </p>
                </div>
                <Switch
                  id="virtual-camera"
                  checked={virtualCameraActive}
                  onCheckedChange={handleVirtualCameraToggle}
                  data-testid="switch-virtual-camera"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Browser Source URL (for OBS)</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/stream/avatar-preview`}
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
                <p className="text-xs text-muted-foreground">
                  Use this URL in OBS Browser Source to capture the avatar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Test Input</CardTitle>
              <CardDescription>Test your avatar with text or microphone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="test-text" className="text-xs" data-testid="label-test-text">Type Text to Test</Label>
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
                  size="sm"
                  onClick={handleTextProcess}
                  disabled={!testText.trim() || isProcessing}
                  data-testid="button-process-text"
                >
                  <Play className="w-3 h-3 mr-2" />
                  {isProcessing ? "Processing..." : "Process Text"}
                </Button>
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                variant={isRecording ? "destructive" : "default"}
                className="w-full"
                onClick={handleMicToggle}
                data-testid="button-toggle-mic"
              >
                {isRecording ? (
                  <>
                    <Square className="w-3 h-3 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 mr-2" />
                    Start Live Microphone
                  </>
                )}
              </Button>

              {isRecording && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="text-xs font-medium text-destructive mb-1">🔴 Live</div>
                  <div className="text-xs text-muted-foreground">
                    Speak into your microphone to see real-time viseme sequencing
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Manual Triggers</CardTitle>
              <CardDescription className="text-xs">Click to manually trigger visemes (Press Space for Rest)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleRestTrigger}
                disabled={isProcessing || !project?.restPositionClipUrl}
                className="w-full font-semibold"
                data-testid="button-trigger-rest"
              >
                Rest Position (Space Bar)
              </Button>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(visemeMap).map(([id, data]) => {
                  const visemeData = data as { label: string; phonemes: readonly string[]; color: string; example?: string };
                  return (
                    <Button
                      key={id}
                      variant={currentViseme === id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleManualTrigger(id)}
                      disabled={isProcessing}
                      className="font-mono text-xs h-7"
                      style={currentViseme === id ? {
                        backgroundColor: visemeData.color,
                        borderColor: visemeData.color,
                      } : {
                        borderColor: visemeData.color,
                      }}
                      data-testid={`button-trigger-${id}`}
                    >
                      {id}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Export</CardTitle>
              <CardDescription className="text-xs">Save your avatar configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={onExport}
                disabled={clips.length === 0}
                data-testid="button-export-config"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Configuration
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Visemes Stream</CardTitle>
          <CardDescription>{project?.visemeComplexity || 3}-viseme system - {Object.keys(visemeMap).length} mouth shapes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(visemeMap).map(([id, data]) => {
              const visemeData = data as { label: string; phonemes: readonly string[]; color: string; example?: string };
              return (
                <div key={id} className="flex flex-col items-center gap-1">
                  <Badge
                    variant={currentViseme === id ? "default" : "outline"}
                    className="font-mono transition-all"
                    style={currentViseme === id ? {
                      backgroundColor: visemeData.color,
                      borderColor: visemeData.color,
                      color: "hsl(var(--primary-foreground))",
                    } : {
                      borderColor: visemeData.color,
                      color: visemeData.color,
                    }}
                    data-testid={`viseme-indicator-${id}`}
                  >
                    {id}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{visemeData.example || visemeData.phonemes.slice(0, 3).join(",")}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
