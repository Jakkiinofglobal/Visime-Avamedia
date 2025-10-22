import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project } from "@shared/schema";

interface ProjectSetupProps {
  project: Project;
  onComplete?: () => void;
}

export default function ProjectSetup({ project, onComplete }: ProjectSetupProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const uploadAudioMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "training-audio.webm");
      
      const response = await apiRequest("POST", `/api/projects/${project.id}/training-audio`, formData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
      toast({
        title: "Training audio uploaded",
        description: "Your training audio has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload training audio",
        variant: "destructive",
      });
    },
  });

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        uploadAudioMutation.mutate(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: "Say the training sentence clearly",
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleContinue = () => {
    onComplete?.();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const hasTrainingAudio = !!project.trainingAudioUrl;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Configuration</CardTitle>
          <CardDescription>Your avatar settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Frame Rate:</span>
              <p className="font-medium">{project.fps} FPS</p>
            </div>
            <div>
              <span className="text-muted-foreground">Resolution:</span>
              <p className="font-medium">{project.resolution}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Viseme Complexity:</span>
              <p className="font-medium">{project.visemeComplexity || 3} visemes</p>
            </div>
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

          {hasTrainingAudio && !isRecording && !uploadAudioMutation.isPending ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Training audio recorded</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartRecording}
                data-testid="button-re-record"
              >
                <Mic className="w-4 h-4 mr-2" />
                Re-record
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="w-full"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={uploadAudioMutation.isPending}
              data-testid="button-record-training"
            >
              {uploadAudioMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handleContinue}
            disabled={!hasTrainingAudio}
            data-testid="button-continue-setup"
          >
            Continue to Phoneme Alignment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
