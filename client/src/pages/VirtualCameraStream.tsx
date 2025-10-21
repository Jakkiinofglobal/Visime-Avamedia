import { useState, useRef, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { VisemeClip, Project } from "@shared/schema";

export default function VirtualCameraStream() {
  const [, params] = useRoute("/stream/avatar-preview/:projectId");
  const projectId = params?.projectId || localStorage.getItem("lastProjectId") || "";
  const [removeGreenScreen, setRemoveGreenScreen] = useState(true);
  const [currentViseme, setCurrentViseme] = useState("V2");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement[]>>(new Map());
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const variantIndexRef = useRef<Map<string, number>>(new Map());
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  const { data: clips = [] } = useQuery<VisemeClip[]>({
    queryKey: ["/api/projects", projectId, "clips"],
    enabled: !!projectId,
  });

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
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
          restVideo = videos.find((v: HTMLVideoElement) => v.src.endsWith(restClipUrl)) || null;
          if (restVideo) break;
        }
      }

      if (!restVideo) {
        const v2Videos = videoMap.get("V2");
        restVideo = v2Videos?.[0] || null;
      }

      if (!restVideo) {
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
  }, [clips, project?.restPositionClipUrl]);

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

  useEffect(() => {
    const switchVideo = () => {
      const videos = videoElementsRef.current.get(currentViseme);
      
      if (!videos || videos.length === 0) {
        const restClipUrl = project?.restPositionClipUrl;
        let restVideo: HTMLVideoElement | null = null;

        if (restClipUrl) {
          for (const [visemeId, vids] of Array.from(videoElementsRef.current.entries())) {
            restVideo = vids.find((v: HTMLVideoElement) => v.src.endsWith(restClipUrl)) || null;
            if (restVideo) break;
          }
        }

        if (!restVideo) {
          const v2Videos = videoElementsRef.current.get("V2");
          restVideo = v2Videos?.[0] || null;
        }

        if (!restVideo) {
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
        setCurrentViseme("V2");
      };
    };

    switchVideo();
  }, [currentViseme, clips, project?.restPositionClipUrl]);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0, 
      overflow: 'hidden',
      backgroundColor: '#000000'
    }}>
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}
