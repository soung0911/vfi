import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  activeSliderIdAtom,
  isTryMoreAtom,
  resultAtom,
  resultIsLoading,
  selectedEndIdxAtom,
  selectedStartIdxAtom,
  tryResultAtom,
} from "@/store/mid-frame-generator-store";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import ImageSlider from "../image-slider";
import FrameCountSelector from "../frame-count-selector";

interface MidFrameGeneratorTryMoreControls {
  frameCount: string;
  setFrameCount: (value: string) => void;
  onGenerate: () => void;
  selectedIdx: number;
  setSelectedIdx: React.Dispatch<React.SetStateAction<number>>;
  onClear: () => void;
}

export default function MidFrameGeneratorTryMoreControls({
  frameCount,
  setFrameCount,
  onGenerate,
  selectedIdx,
  setSelectedIdx,
  onClear,
}: MidFrameGeneratorTryMoreControls) {
  const setActiveSlider = useSetAtom(activeSliderIdAtom);

  const result = useAtomValue(resultAtom);
  const tryResult = useAtomValue(tryResultAtom);

  const isLoading = useAtomValue(resultIsLoading);
  const setIsTryMore = useSetAtom(isTryMoreAtom);
  const [selectedStartIdx, setSelectedStartIdx] = useAtom(selectedStartIdxAtom);
  const [selectedEndIdx, setSelectedEndIdx] = useAtom(selectedEndIdxAtom);

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
      <div className="w-full flex gap-6">
        <Card
          className="p-3 flex-1 overflow-hidden"
          onClick={() => setActiveSlider("start")}
        >
          <CardHeader className="p-2">
            <CardTitle>Select second start image.</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ImageSlider
              type="select"
              resultFrames={result.frames}
              selectedIdx={selectedStartIdx}
              setSelectedIdx={setSelectedStartIdx}
              sliderId="start"
            />
          </CardContent>
        </Card>
        <Card
          className="p-3 flex-1 overflow-hidden"
          onClick={() => setActiveSlider("end")}
        >
          <CardHeader className="p-2">
            <CardTitle>Select second end image.</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ImageSlider
              type="select"
              resultFrames={result.frames}
              selectedIdx={selectedEndIdx}
              setSelectedIdx={setSelectedEndIdx}
              sliderId="end"
            />
          </CardContent>
        </Card>
      </div>

      <FrameCountSelector
        frameCount={frameCount}
        setFrameCount={setFrameCount}
        showCreditInfo={showCreditInfo}
        handleGenerateClick={handleGenerateClick}
      />

      {tryResult.frames.length > 0 && (
        <Card className="p-2" onClick={() => setActiveSlider("result-try")}>
          <ImageSlider
            type="result"
            resultFrames={tryResult.frames}
            selectedIdx={selectedIdx}
            setSelectedIdx={setSelectedIdx}
            resultPath={tryResult.path as string}
            sliderId="result-try"
          />
        </Card>
      )}
      <div className="w-full flex gap-2">
        <Button
          className="flex-1"
          onClick={() => setIsTryMore(false)}
          disabled={isLoading}
        >
          Go back
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
  );
}
