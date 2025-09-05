import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { activeSliderIdAtom } from "@/store/motion-easer-store";
import { DownloadIcon } from "@radix-ui/react-icons";
import { useAtom } from "jotai";
import Image from "next/image";
import { useCallback, useEffect } from "react";

interface ImageSliderProps {
  images: string[];
  selectedIdx: number;
  setSelectedIdx: React.Dispatch<React.SetStateAction<number>>;
  onDownloadClick?: () => void;
  getFrameName?: (index: number) => string;
  sliderId: string;
}

export default function ImageSlider({
  images,
  selectedIdx,
  setSelectedIdx,
  onDownloadClick,
  getFrameName,
  sliderId,
}: ImageSliderProps) {
  const [activeSlider] = useAtom(activeSliderIdAtom);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activeSlider !== sliderId) return;

      const direction = e.key === "ArrowLeft" ? -1 : 1;

      setSelectedIdx((prev) => {
        const newIdx = (prev + direction + images.length) % images.length;

        return newIdx;
      });
    },
    [activeSlider, sliderId, setSelectedIdx, images.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <>
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-2">
        <div className="relative w-full h-auto aspect-video overflow-hidden">
          <Image
            src={images[selectedIdx]}
            alt={`Gallery image ${selectedIdx + 1}`}
            fill
            className="object-contain"
          />
          {onDownloadClick && (
            <Button
              className="absolute top-2 right-2 rounded-full w-6 h-6 bg-[#1976D2]"
              size="icon"
              onClick={() => onDownloadClick()}
            >
              <DownloadIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="font-bold">
          {getFrameName
            ? getFrameName(selectedIdx)
            : `Frame ${selectedIdx + 1}`}
        </div>
      </div>
      <ScrollArea>
        <div className="flex justify-center">
          <div
            className="flex w-max p-4 space-x-2"
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest("button")) {
                const rect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const buttonWidth = 80;
                const gap = 8;
                const totalWidth = buttonWidth + gap;
                const clickedIndex = Math.floor(x / totalWidth);

                if (clickedIndex >= 0 && clickedIndex < images.length) {
                  setSelectedIdx(clickedIndex);
                }
              }
            }}
          >
            {images.map((src, index) => (
              <button
                key={index}
                onClick={() => setSelectedIdx(index)}
                className={cn(
                  "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md",
                  selectedIdx === index && "ring-4 ring-blue-500 ring-offset-2"
                )}
              >
                <Image
                  src={src}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
}
