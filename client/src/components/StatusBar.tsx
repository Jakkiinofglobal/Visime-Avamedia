import { Badge } from "@/components/ui/badge";
import { Mic, Video, Wifi } from "lucide-react";

interface StatusBarProps {
  micActive?: boolean;
  virtualCameraOn?: boolean;
  latency?: number;
}

export default function StatusBar({ micActive = false, virtualCameraOn = false, latency = 0 }: StatusBarProps) {
  const getLatencyStatus = () => {
    if (latency === 0) return { label: "Idle", color: "text-muted-foreground" };
    if (latency < 300) return { label: "Excellent", color: "text-chart-2" };
    if (latency < 500) return { label: "Good", color: "text-chart-3" };
    return { label: "High", color: "text-destructive" };
  };

  const latencyStatus = getLatencyStatus();

  return (
    <div className="h-8 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Mic className={`w-3 h-3 ${micActive ? 'text-chart-2' : 'text-muted-foreground'}`} />
          <span className={micActive ? 'text-chart-2 font-medium' : 'text-muted-foreground'}>
            Mic: {micActive ? 'Active' : 'Off'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Video className={`w-3 h-3 ${virtualCameraOn ? 'text-chart-2' : 'text-muted-foreground'}`} />
          <span className={virtualCameraOn ? 'text-chart-2 font-medium' : 'text-muted-foreground'}>
            Virtual Camera: {virtualCameraOn ? 'On' : 'Off'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Wifi className={`w-3 h-3 ${latencyStatus.color}`} />
        <span className="font-mono">
          Latency: <span className={`font-bold ${latencyStatus.color}`}>{latency}ms</span>
        </span>
        <Badge variant="outline" className={`h-5 text-xs ${latencyStatus.color}`}>
          {latencyStatus.label}
        </Badge>
      </div>
    </div>
  );
}
