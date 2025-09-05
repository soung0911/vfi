import { postDownloadZip } from "@/apis/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { downloadFrame } from "@/lib/frameDownloader";
import {
  activeSliderIdAtom,
  resultStateAtom,
  selectedResultIdxAtom,
} from "@/store/motion-easer-store";
import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";
import { toast } from "sonner";
import MotionEaserFrameControls from "./frame-controls";
import ImageSlider from "./image-slider";

export default function MotionEaserResult() {
  const setActiveSlider = useSetAtom(activeSliderIdAtom);
  const [resultState] = useAtom(resultStateAtom);

  const [selectedResultIdx, setSelectedResultIdx] = useAtom(
    selectedResultIdxAtom
  );
  const [isZipLoading, setIsZipLoading] = useState(false);

  const handleDownloadClick = async () => {
    await downloadFrame({
      img_path: resultState.path as string,
      index: String(selectedResultIdx),
    });
  };

  const handleDownloadZipClick = async () => {
    if (!resultState.path) {
      toast.error("No result available for download.");
      return;
    }

    setIsZipLoading(true);

    try {
      const data = await postDownloadZip({ img_path: resultState.path });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "result_frames.zip";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("ZIP file download completed.");
    } catch (error) {
      console.error("Error during ZIP file download:", error);
      toast.error("Failed to download ZIP file.");
    } finally {
      setIsZipLoading(false);
    }
  };

  const getFrameName = (index: number) => {
    if (resultState.dataSet.length === 0) return `Frame ${index + 1}`;

    let currentFrame = 1;
    let newFrameCount = 0;

    for (let i = 0; i < resultState.dataSet.length; i++) {
      if (index === newFrameCount) {
        return `Frame ${currentFrame}`;
      }

      if (resultState.dataSet[i] > 0) {
        for (let j = 1; j <= resultState.dataSet[i]; j++) {
          newFrameCount++;
          if (index === newFrameCount) {
            return `(new) Frame ${currentFrame + j / (resultState.dataSet[i] + 1)}`;
          }
        }
      }

      currentFrame++;
      newFrameCount++;
    }

    return `Frame ${currentFrame}`;
  };

  return (
    <Card
      className="p-3 flex-1 overflow-hidden"
      onClick={() => setActiveSlider("result")}
    >
      <CardHeader className="p-3 flex flex-row justify-between items-center space-y-0">
        <div>
          <CardTitle>Result</CardTitle>
          <CardDescription>
            You can download each frame of generated result with download
            button. (top right of image)
          </CardDescription>
        </div>
        <Button
          onClick={handleDownloadZipClick}
          disabled={isZipLoading || resultState.path === null}
          className="bg-blue-600"
        >
          {isZipLoading ? <>Downloading...</> : "Download ZIP"}
        </Button>
      </CardHeader>
      <CardContent className="p-3">
        <ImageSlider
          images={resultState.frames}
          selectedIdx={selectedResultIdx}
          setSelectedIdx={setSelectedResultIdx}
          getFrameName={getFrameName}
          sliderId="result"
          {...(resultState.path && { onDownloadClick: handleDownloadClick })}
        />
        <div className="mt-2" />
        <MotionEaserFrameControls
          frames={resultState.frames}
          selectedIdx={selectedResultIdx}
          setSelectedIdx={setSelectedResultIdx}
        />
      </CardContent>
    </Card>
  );
}
