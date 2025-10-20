import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import ProjectSetup from "@/components/ProjectSetup";
import PhonemeTimeline from "@/components/PhonemeTimeline";
import VisemeClipUploader from "@/components/VisemeClipUploader";
import AvatarPreview from "@/components/AvatarPreview";
import StatusBar from "@/components/StatusBar";
import ThemeToggle from "@/components/ThemeToggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, PhonemeSegment } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState("setup");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [latency, setLatency] = useState(0);

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; fps: number; resolution: string }) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return await response.json() as Project;
    },
    onSuccess: (project) => {
      setCurrentProject(project);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const handleSetupComplete = (config: { name: string; fps: number; resolution: string }) => {
    createProjectMutation.mutate(config);
    setActiveTab("alignment");
  };

  const handleAlignmentComplete = () => {
    setActiveTab("upload");
  };

  const handleUploadComplete = () => {
    setActiveTab("preview");
  };

  return (
    <div className="flex flex-col h-screen">
      <StatusBar micActive={micActive} virtualCameraOn={false} latency={latency} />
      
      <header className="h-14 border-b bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">VA</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Viseme Avatar Studio</h1>
            <p className="text-xs text-muted-foreground">
              {currentProject ? currentProject.name : "Real-time Video Avatar Creator"}
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
                segments={currentProject?.phonemeTimeline as PhonemeSegment[] | undefined}
                duration={3.2}
                onContinue={handleAlignmentComplete}
                projectId={currentProject?.id}
                onProjectUpdate={(updatedProject) => setCurrentProject(updatedProject)}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <VisemeClipUploader 
                onContinue={handleUploadComplete}
                projectId={currentProject?.id}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <AvatarPreview 
                onExport={() => console.log("Export triggered")}
                projectId={currentProject?.id}
                onMicStatusChange={setMicActive}
                onLatencyChange={setLatency}
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
