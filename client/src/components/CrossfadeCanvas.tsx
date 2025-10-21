import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

interface CrossfadeCanvasProps {
  currentSrc: string;
  nextSrc: string;
  onSwapped?: () => void;
  fadeMs?: number;
  width?: number;
  height?: number;
  removeGreenScreen?: boolean;
  backgroundImage?: HTMLImageElement | null;
}

const CrossfadeCanvas = forwardRef<HTMLCanvasElement, CrossfadeCanvasProps>((props, ref) => {
  const {
    currentSrc,
    nextSrc,
    onSwapped,
    fadeMs = 120,
    width = 1920,
    height = 1080,
    removeGreenScreen = false,
    backgroundImage = null,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vA = useRef<HTMLVideoElement>(document.createElement("video"));
  const vB = useRef<HTMLVideoElement>(document.createElement("video"));
  const [phase, setPhase] = useState<"idle" | "fading">("idle");
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  useImperativeHandle(ref, () => canvasRef.current!);

  useEffect(() => {
    for (const v of [vA.current, vB.current]) {
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = "auto";
      v.crossOrigin = "anonymous";
    }
  }, []);

  const processGreenScreen = (ctx: CanvasRenderingContext2D, video: HTMLVideoElement, destWidth: number, destHeight: number, offsetX: number, offsetY: number) => {
    if (!removeGreenScreen) {
      ctx.drawImage(video, offsetX, offsetY, destWidth, destHeight);
      return;
    }

    if (!offscreenCanvasRef.current || offscreenCanvasRef.current.width !== video.videoWidth || offscreenCanvasRef.current.height !== video.videoHeight) {
      offscreenCanvasRef.current = document.createElement("canvas");
      offscreenCanvasRef.current.width = video.videoWidth;
      offscreenCanvasRef.current.height = video.videoHeight;
      offscreenCtxRef.current = offscreenCanvasRef.current.getContext("2d", { willReadFrequently: true });
    }

    const tempCtx = offscreenCtxRef.current;
    
    if (!tempCtx) {
      ctx.drawImage(video, offsetX, offsetY, destWidth, destHeight);
      return;
    }

    tempCtx.drawImage(video, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, video.videoWidth, video.videoHeight);
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
    ctx.drawImage(offscreenCanvasRef.current, 0, 0, video.videoWidth, video.videoHeight, offsetX, offsetY, destWidth, destHeight);
  };

  useEffect(() => {
    let raf = 0;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const tick = () => {
      const canvasWidth = width;
      const canvasHeight = height;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (backgroundImage && removeGreenScreen) {
        ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
      }

      if (!vA.current.paused && vA.current.readyState >= 2 && phase === "idle" && currentSrc) {
        const activeVideo = vA.current;
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

        processGreenScreen(ctx, activeVideo, drawWidth, drawHeight, offsetX, offsetY);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, width, height, removeGreenScreen, backgroundImage, currentSrc]);

  useEffect(() => {
    if (!currentSrc) {
      vA.current.pause();
      vA.current.currentTime = 0;
      return;
    }
    vA.current.src = currentSrc;
    vA.current.oncanplay = () => vA.current.play().catch(console.error);
  }, [currentSrc]);

  useEffect(() => {
    if (!nextSrc || nextSrc === currentSrc) return;
    
    let raf = 0;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    vB.current.src = nextSrc;
    vB.current.oncanplay = async () => {
      await vB.current.play().catch(console.error);
      setPhase("fading");
      const start = performance.now();
      
      const loop = () => {
        const t = performance.now() - start;
        const a = Math.min(1, t / fadeMs);

        const canvasWidth = width;
        const canvasHeight = height;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        if (backgroundImage && removeGreenScreen) {
          ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
        }

        const getVideoMetrics = (video: HTMLVideoElement) => {
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
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

          return { drawWidth, drawHeight, offsetX, offsetY };
        };

        const metricsA = getVideoMetrics(vA.current);
        const metricsB = getVideoMetrics(vB.current);

        ctx.globalAlpha = 1 - a;
        processGreenScreen(ctx, vA.current, metricsA.drawWidth, metricsA.drawHeight, metricsA.offsetX, metricsA.offsetY);

        ctx.globalAlpha = a;
        processGreenScreen(ctx, vB.current, metricsB.drawWidth, metricsB.drawHeight, metricsB.offsetX, metricsB.offsetY);

        ctx.globalAlpha = 1;

        if (a < 1) {
          raf = requestAnimationFrame(loop);
        } else {
          const tmp = vA.current;
          vA.current = vB.current;
          vB.current = tmp;
          setPhase("idle");
          onSwapped?.();
        }
      };
      raf = requestAnimationFrame(loop);
    };

    return () => cancelAnimationFrame(raf);
  }, [nextSrc, fadeMs, width, height, currentSrc, onSwapped, removeGreenScreen, backgroundImage]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" data-testid="canvas-preview" />;
});

CrossfadeCanvas.displayName = "CrossfadeCanvas";

export default CrossfadeCanvas;
