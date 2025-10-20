import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings, Download } from "lucide-react";
import ProjectSetup from "@/components/ProjectSetup";
import PhonemeTimeline from "@/components/PhonemeTimeline";
import VisemeClipUploader from "@/components/VisemeClipUploader";
import AvatarPreview from "@/components/AvatarPreview";
import StatusBar from "@/components/StatusBar";
import ThemeToggle from "@/components/ThemeToggle";

//todo: remove mock functionality
const mockSegments = [
  { phoneme: "dh", start: 0.0, end: 0.15, viseme: "V11" },
  { phoneme: "ah", start: 0.15, end: 0.30, viseme: "V3" },
  { phoneme: "k", start: 0.30, end: 0.45, viseme: "V14" },
  { phoneme: "w", start: 0.45, end: 0.60, viseme: "V8" },
  { phoneme: "ih", start: 0.60, end: 0.75, viseme: "V6" },
  { phoneme: "k", start: 0.75, end: 0.90, viseme: "V14" },
  { phoneme: "b", start: 0.90, end: 1.05, viseme: "V1" },
  { phoneme: "r", start: 1.05, end: 1.20, viseme: "V13" },
  { phoneme: "aw", start: 1.20, end: 1.40, viseme: "V7" },
  { phoneme: "n", start: 1.40, end: 1.55, viseme: "V14" },
  { phoneme: "f", start: 1.55, end: 1.75, viseme: "V10" },
  { phoneme: "aa", start: 1.75, end: 1.90, viseme: "V3" },
  { phoneme: "k", start: 1.90, end: 2.05, viseme: "V14" },
  { phoneme: "s", start: 2.05, end: 2.25, viseme: "V12" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("setup");
  const [micActive, setMicActive] = useState(false);
  const [latency, setLatency] = useState(0);

  const handleSetupComplete = () => {
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
            <p className="text-xs text-muted-foreground">Real-time Video Avatar Creator</p>
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
                segments={mockSegments}
                duration={3.2}
                onContinue={handleAlignmentComplete}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <VisemeClipUploader onContinue={handleUploadComplete} />
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <AvatarPreview onExport={() => console.log("Export triggered")} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
