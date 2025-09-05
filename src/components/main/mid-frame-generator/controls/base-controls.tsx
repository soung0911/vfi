import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  activeSliderIdAtom,
  isTryMoreAtom,
  resultAtom,
  resultIsLoading,
} from "@/store/mid-frame-generator-store";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import FrameCountSelector from "../frame-count-selector";
import ImageSlider from "../image-slider";

interface MidFrameGeneratorControlsProps {
  frameCount: string;
  setFrameCount: (value: string) => void;
  onGenerate: () => void;
  selectedIdx: number;
  setSelectedIdx: React.Dispatch<React.SetStateAction<number>>;
  onClear: () => void;
}
export default function MidFrameGeneratorControls({
  frameCount,
  setFrameCount,
  onGenerate,
  selectedIdx,
  setSelectedIdx,
  onClear,
}: MidFrameGeneratorControlsProps) {
  const setActiveSlider = useSetAtom(activeSliderIdAtom);
  const result = useAtomValue(resultAtom);
  const isLoading = useAtomValue(resultIsLoading);
  const setIsTryMore = useSetAtom(isTryMoreAtom);

  const [showCreditInfo, setShowCreditInfo] = useState(false);

  const handleGenerateClick = () => {
    if (!showCreditInfo) {
      setShowCreditInfo(true);
    } else {
      onGenerate();
      setShowCreditInfo(false);
    }
  };

  const handleClear = () => {
    setShowCreditInfo(false);
    onClear();
  };

  return (
    <>
      <FrameCountSelector
        frameCount={frameCount}
        setFrameCount={setFrameCount}
        showCreditInfo={showCreditInfo}
        handleGenerateClick={handleGenerateClick}
      />
      {result.frames.length > 0 ? (
        <>
          <Card className="p-6" onClick={() => setActiveSlider("result")}>
            <ImageSlider
              type="result"
              resultFrames={result.frames}
              selectedIdx={selectedIdx}
              resultPath={result.path as string}
              setSelectedIdx={setSelectedIdx}
              sliderId="result"
            />
          </Card>
          <div className="w-full flex gap-2">
            <Button
              className="flex-1"
              onClick={() => setIsTryMore(true)}
              disabled={isLoading}
            >
              Try more (with generated images)
            </Button>
            <Button
              className="flex-1 bg-red-600"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </>
      ) : (
        <Button
          className="flex-1 bg-red-600"
          onClick={handleClear}
          disabled={isLoading}
        >
          Clear
        </Button>
      )}
    </>
  );
}
