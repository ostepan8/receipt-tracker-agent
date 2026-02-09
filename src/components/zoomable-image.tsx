"use client";

import { useState } from "react";
import Image from "next/image";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  showControls?: boolean;
}

function ZoomControls({ onFullScreen }: { onFullScreen?: () => void }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full shadow-lg px-2 py-1.5 z-10 border border-slate-200/50">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-slate-100"
        onClick={() => zoomOut()}
        title="Zoom out"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-slate-100"
        onClick={() => resetTransform()}
        title="Reset zoom"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-slate-100"
        onClick={() => zoomIn()}
        title="Zoom in"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </Button>
      {onFullScreen && (
        <>
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-slate-100"
            onClick={onFullScreen}
            title="Full screen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

export function ZoomableImage({
  src,
  alt,
  className,
  aspectRatio = "aspect-[3/4]",
  showControls = true,
}: ZoomableImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleFullScreen = () => {
    window.open(src, "_blank");
  };

  return (
    <div className={cn("relative bg-slate-50 overflow-hidden rounded-lg", aspectRatio, className)}>
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={5}
        centerOnInit={false}
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: "toggle", step: 2 }}
        onTransformed={(ref) => {
          setIsZoomed(ref.state.scale > 1);
        }}
      >
        {() => (
          <>
            {showControls && <ZoomControls onFullScreen={handleFullScreen} />}
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
              }}
              contentStyle={{
                width: "100%",
                height: "100%",
              }}
            >
              <div className="relative w-full h-full">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className={cn(
                    "object-cover transition-all",
                    isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                  )}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
