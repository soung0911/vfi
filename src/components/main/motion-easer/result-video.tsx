import { postDownloadVideo } from "@/apis/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inputFileStateAtom,
  resultStateAtom,
} from "@/store/motion-easer-store";
import { useAtom } from "jotai";
import { useState } from "react";
import { toast } from "sonner";

const FPSButtonData = [
  { value: 23.976, label: "23.976" },
  { value: 24, label: "24" },
  { value: 29.97, label: "29.97" },
  { value: 30, label: "30" },
  { value: 59.94, label: "59.94" },
  { value: 60, label: "60" },
];

export default function MotionEaserResultVideo() {
  const [inputFileState] = useAtom(inputFileStateAtom);
  const [resultState] = useAtom(resultStateAtom);

  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>(
    {}
  );
  const [selectedFormat, setSelectedFormat] = useState<string>("mov");

  const handleDownloadFPSVideoClick = async (fps: number) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [fps]: true }));
      // const videoData = await postDownloadVideo({
      //   fps: 23.976,
      //   img_path:
      //     "/var/www/html/vfi/test/20241205_103506_acc2d76a-8af2-40a0-9c00-fad94eca3f10/images/test_vfi_20241205_103750/images",
      //   pixfmt: "yuv420p",
      //   videoext: "mov",
      // });
      const videoData = await postDownloadVideo({
        img_path: resultState.path as string,
        fps: fps,
        pixfmt: inputFileState?.pixfmt as string,
        videoext: selectedFormat,
      });

      const videoUrl = URL.createObjectURL(videoData);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = videoUrl;
      a.download = `result_video_${String(fps).replace(
        ".",
        "_"
      )}fps.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(videoUrl);
      document.body.removeChild(a);

      toast.success(`Video download completed (${fps} FPS).`);
    } catch (error) {
      toast.error("Failed to download video.");
      console.error(error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [fps]: false }));
    }
  };

  return (
    <Card className="p-3 flex flex-col flex-1 gap-2">
      <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col">
          <CardTitle>Result Video</CardTitle>
          <CardDescription className="font-normal">
            If input is image frames, default fps of result video is 24. Else,
            fps value follows input video.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-1">
        {resultState.video && (
          <video
            controls
            className="w-full h-full object-contain"
            key={resultState.video}
            playsInline
            autoPlay={false}
          >
            <source src={resultState.video} />
            Your browser does not support the video tag.
          </video>
        )}
      </CardContent>
      <CardFooter className="p-3 flex flex-col gap-4">
        <div className="flex items-center gap-4 w-full">
          <p className="text-sm font-medium">Export Format:</p>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mov">MOV</SelectItem>
              <SelectItem value="mp4">MP4</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full">
          {FPSButtonData.map(({ value }) => (
            <Button
              key={value}
              className="bg-blue-600 p-5"
              onClick={() => handleDownloadFPSVideoClick(value)}
              disabled={loadingStates[value] || resultState.path === null}
            >
              {loadingStates[value]
                ? "Downloading..."
                : `Download Video (fps=${value})`}
            </Button>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
