import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, ArrowLeft } from "lucide-react";
import ProjectSetup from "@/components/ProjectSetup";
import PhonemeTimeline from "@/components/PhonemeTimeline";
import VisemeClipUploader from "@/components/VisemeClipUploader";
import AvatarPreview from "@/components/AvatarPreview";
import StatusBar from "@/components/StatusBar";
import ThemeToggle from "@/components/ThemeToggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, PhonemeSegment } from "@shared/schema";

export default function ProjectPage() {
  const [, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const projectId = params?.id;
  
  const [activeTab, setActiveTab] = useState("setup");
  const [micActive, setMicActive] = useState(false);
  const [latency, setLatency] = useState(0);
  const [virtualCameraOn, setVirtualCameraOn] = useState(false);

  const { data: currentProject, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Project not found");
      return response.json();
    },
    enabled: !!projectId,
  });

  const handleSetupComplete = () => {
    setActiveTab("alignment");
  };

  const handleAlignmentComplete = () => {
    setActiveTab("upload");
  };

  const handleUploadComplete = () => {
    setActiveTab("preview");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading avatar...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Avatar not found</div>
          <Button onClick={() => setLocation("/")} data-testid="button-back-home">
            Back to Avatars
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <StatusBar micActive={micActive} virtualCameraOn={virtualCameraOn} latency={latency} />
      
      <header className="h-14 border-b bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Avatars
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-lg font-bold">
              {isLoading ? "Loading..." : currentProject?.name || "Unknown Project"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {currentProject ? `${currentProject.fps} FPS • ${currentProject.resolution}` : "Real-time Video Avatar"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b bg-sidebar px-6">
          <TabsList className="h-12 bg-transparent" data-testid="tabs-workflow">
            <TabsTrigger value="setup" className="data-[state=active]:bg-sidebar-accent" data-testid="tab-setup">
              Setup
            </TabsTrigger>
            <TabsTrigger value="alignment" className="data-[state=active]:bg-sidebar-accent" data-testid="tab-alignment">
              Phoneme Alignment
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-sidebar-accent" data-testid="tab-upload">
              Upload Clips
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-sidebar-accent" data-testid="tab-preview">
              Test & Stream
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            <TabsContent value="setup" className="mt-0">
              <ProjectSetup onComplete={handleSetupComplete} />
            </TabsContent>

            <TabsContent value="alignment" className="mt-0">
              <PhonemeTimeline
                segments={currentProject.phonemeTimeline as PhonemeSegment[] | undefined}
                duration={3.2}
                onContinue={handleAlignmentComplete}
                projectId={currentProject.id}
                project={currentProject}
                onProjectUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] })}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <VisemeClipUploader 
                onContinue={handleUploadComplete}
                projectId={currentProject.id}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <AvatarPreview 
                onExport={() => console.log("Export triggered")}
                projectId={currentProject.id}
                onMicStatusChange={setMicActive}
                onLatencyChange={setLatency}
                onVirtualCameraChange={setVirtualCameraOn}
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
