import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { downloadFrame } from "@/lib/frameDownloader";
import { cn } from "@/lib/utils";
import { activeSliderIdAtom } from "@/store/mid-frame-generator-store";
import { DownloadIcon } from "@radix-ui/react-icons";
import { useAtomValue } from "jotai";
import Image from "next/image";
import { useCallback, useEffect } from "react";

interface ImageSliderProps {
  type: "result" | "select";
  resultFrames: string[];
  selectedIdx: number;
  setSelectedIdx: React.Dispatch<React.SetStateAction<number>>;
  resultPath?: string;
  sliderId: string;
}

export default function ImageSlider({
  type,
  resultFrames,
  selectedIdx,
  resultPath,
  setSelectedIdx,
  sliderId,
}: ImageSliderProps) {
  const activeSlider = useAtomValue(activeSliderIdAtom);

  const handleDownloadClick = async () => {
    await downloadFrame({
      img_path: resultPath as string,
      index: String(selectedIdx),
    });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activeSlider !== sliderId) return;

      const direction = e.key === "ArrowLeft" ? -1 : 1;

      setSelectedIdx((prev) => {
        const newIdx =
          (prev + direction + resultFrames.length) % resultFrames.length;

        return newIdx;
      });
    },
    [activeSlider, sliderId, setSelectedIdx, resultFrames.length]
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
            src={resultFrames[selectedIdx]}
            alt={`Gallery image ${selectedIdx + 1}`}
            fill
            className="object-contain"
          />
          {type === "result" && (
            <Button
              className="absolute top-2 right-2 rounded-full w-6 h-6 bg-[#1976D2]"
              size="icon"
              disabled={!resultPath}
              onClick={handleDownloadClick}
            >
              <DownloadIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="font-bold">
          {selectedIdx === 0
            ? "Start Image"
            : selectedIdx === resultFrames.length - 1
            ? "End Image"
            : `Frame ${selectedIdx / (resultFrames.length - 1)}`}
        </div>
      </div>
      <ScrollArea>
        <div className="flex justify-center">
          <div
            className="flex w-max space-x-2 p-4"
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

                if (clickedIndex >= 0 && clickedIndex < resultFrames.length) {
                  setSelectedIdx(clickedIndex);
                }
              }
            }}
          >
            {resultFrames.map((src, index) => (
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
