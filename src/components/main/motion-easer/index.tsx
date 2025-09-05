import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, timeToSeconds } from "@/lib/utils";
import {
  inputFileStateAtom,
  resultProgressAtom,
  resultStateAtom,
  selectedResultIdxAtom,
} from "@/store/motion-easer-store";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import MotionEaserChart, { MotionEaserChartRef } from "./chart";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PlayIcon } from "@radix-ui/react-icons";
import { postDownloadVideo, postUploadFrames } from "@/apis/api";
import { getCookie } from "cookies-next";
import { useCreditInfo } from "@/hooks/useCreditInfo";
import { Progress } from "@/components/ui/progress";
import MotionEaserFrameSequence from "./frame-sequence";
import MotionEaserResultVideo from "./result-video";
import MotionEaserResult from "./result-view";
import { useTheme } from "next-themes";
import UTIF from "utif";

export default function MotionEaser() {
  const { theme } = useTheme();
  const { creditInfo, updateCreditInfo } = useCreditInfo();

  const [inputFileState, setInputFileState] = useAtom(inputFileStateAtom);
  const [resultState, setResultState] = useAtom(resultStateAtom);

  const [, setSelectedResultIdx] = useAtom(selectedResultIdxAtom);

  const [resultProgress, setResultProgress] = useAtom(resultProgressAtom);

  const chartRef = useRef<MotionEaserChartRef>(null);
  const [frameCount, setFrameCount] = useState("1");

  const [isLoading, setIsLoading] = useState(false);
  const [showCreditInfo, setShowCreditInfo] = useState(false);
  const [showDataSetInfo, setShowDataSetInfo] = useState<number>(0);

  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (resultState.status === "success") {
      const fetchVideo = async () => {
        try {
          const videoData = await postDownloadVideo({
            img_path: resultState.path as string,
            fps: inputFileState?.fps as number,
            pixfmt: "demo",
            videoext: "mp4",
          });

          setResultState((prev) => ({
            ...prev,
            video: URL.createObjectURL(videoData),
          }));
        } catch (error) {
          console.error("Error occurred while downloading video:", error);
          toast.error("Failed to download video");
        }
      };

      fetchVideo();
    }

    return () => {
      if (resultState.video) {
        URL.revokeObjectURL(resultState.video);
      }
    };
  }, [resultState.status, resultState.path, setResultState]);

  const handleEditAllClick = () => {
    if (chartRef.current) {
      const value = Number(frameCount);
      chartRef.current.updateAllData(value);
    }
  };

  const handleResetClick = () => {
    if (chartRef.current) {
      chartRef.current.updateAllData(0);
    }
  };

  const handleEaseClick = async () => {
    if (chartRef.current) {
      const currentChartData = chartRef.current.getChartData();
      const currentChartDataCount = currentChartData.reduce(
        (sum, current) => sum + current,
        0
      );

      if (!showCreditInfo) {
        setShowCreditInfo(true);
        setShowDataSetInfo(currentChartDataCount);
      } else {
        if (showDataSetInfo !== currentChartDataCount) {
          setShowDataSetInfo(currentChartDataCount);
          return;
        }

        if (currentChartDataCount === 0) {
          setShowDataSetInfo(currentChartDataCount);
          toast.error(
            "Please select at least one point on the motion graph to ease. The total scale value cannot be zero."
          );
          return;
        }

        setShowCreditInfo(false);
        setIsLoading(true);

        setResultState((prev) => ({
          ...prev,
          frames: [],
          path: null,
          video: null,
          status: null,
          dataSet: [],
        }));

        setSelectedResultIdx(0);

        if (inputFileState.files.length > 1) {
          const formData = new FormData();

          inputFileState.files.forEach((file, index) => {
            formData.append(
              "files",
              file,
              `frame_${index + 1}.${file.type.split("/")[1]}`
            );
          });
          formData.append("extv", inputFileState.files[0].type.split("/")[1]);

          const imgPath = await postUploadFrames(formData);

          setInputFileState((prev) => ({
            ...prev,
            path: imgPath,
            fps: 24,
            pixfmt: "",
          }));

          await easerMotion({
            user_name: getCookie("user_name") as string,
            img_path: imgPath,
            number_list: currentChartData,
            pixfmt: "",
            extv: inputFileState.files[0].type.split("/")[1],
          });
        } else {
          await easerMotion({
            user_name: getCookie("user_name") as string,
            img_path: inputFileState.path as string,
            number_list: currentChartData,
            pixfmt: inputFileState.pixfmt as string,
            extv: "png",
          });
        }
      }
    }
  };

  const easerMotion = async ({
    user_name,
    img_path,
    number_list,
    pixfmt,
    extv,
  }: {
    user_name: string;
    img_path: string;
    number_list: number[];
    pixfmt: string;
    extv: string;
  }) => {
    try {
      const newWs = new WebSocket(
        `wss://${process.env.NEXT_PUBLIC_SERVER_URL}/ws/vfi-service-lvl3`
      );

      setWs(newWs);

      newWs.onopen = async () => {
        console.log("WebSocket connection established");
        setResultState((prev) => ({
          ...prev,
          dataSet: number_list,
          status: "start",
        }));
        newWs.send(
          JSON.stringify({
            user_name,
            img_path,
            number_list,
            pixfmt,
            extv,
          })
        );
        newWs.send("END");
      };

      newWs.onmessage = async (event) => {
        if (typeof event.data === "string") {
          const data = JSON.parse(event.data);
          if (data.status === "start process") {
            setResultProgress(0);
          } else if (data.status === "processing") {
            const totalTime = timeToSeconds(data.eta);
            const remainingTime = timeToSeconds(data.left);
            const elapsedTime = totalTime - remainingTime;
            const progressPercentage = (elapsedTime / totalTime) * 100;

            setResultProgress(Math.min(progressPercentage, 100));
          } else if (data.status === "completed") {
            setResultState((prev) => ({
              ...prev,
              path: data.img_path,
              status: "success",
            }));
            updateCreditInfo();
            setResultProgress(0);
          } else if (data.status === "error") {
            setResultState((prev) => ({
              ...prev,
              status: "error",
            }));
            toast.error("An error occurred. Please try again later.");
            console.log(`Error: ${data.message}`);
            newWs.close();
          }
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            const buffer = reader.result as ArrayBuffer;
            const frameData = buffer.slice(4);
            const frameBlob = new Blob([frameData]);

            // TIFF 처리
            const tiffReader = new FileReader();
            tiffReader.onload = () => {
              const tiffBuffer = tiffReader.result as ArrayBuffer;
              try {
                const ifds = UTIF.decode(tiffBuffer);
                if (ifds && ifds.length > 0) {
                  // TIFF 파일인 경우
                  UTIF.decodeImage(tiffBuffer, ifds[0]);
                  const rgba = UTIF.toRGBA8(ifds[0]);

                  const canvas = document.createElement("canvas");
                  canvas.width = ifds[0].width;
                  canvas.height = ifds[0].height;
                  const ctx = canvas.getContext("2d");

                  if (ctx) {
                    const imgData = ctx.createImageData(
                      canvas.width,
                      canvas.height
                    );
                    for (let i = 0; i < rgba.length; i++) {
                      imgData.data[i] = rgba[i];
                    }
                    ctx.putImageData(imgData, 0, 0);

                    const frameUrl = canvas.toDataURL("image/jpeg", 0.9);
                    setResultState((prev) => ({
                      ...prev,
                      frames: [...prev.frames, frameUrl],
                    }));
                  }
                } else {
                  // 일반 이미지인 경우
                  const frameUrl = URL.createObjectURL(frameBlob);
                  setResultState((prev) => ({
                    ...prev,
                    frames: [...prev.frames, frameUrl],
                  }));
                }
              } catch {
                // TIFF 디코딩 실패 시 일반 이미지로 처리
                const frameUrl = URL.createObjectURL(frameBlob);
                setResultState((prev) => ({
                  ...prev,
                  frames: [...prev.frames, frameUrl],
                }));
              }
            };
            tiffReader.readAsArrayBuffer(frameBlob);
          };
          reader.readAsArrayBuffer(event.data);

          console.log("Received and processed a frame");
        }
      };

      newWs.onerror = (wsError) => {
        toast.error(`WebSocket error: ${wsError}`);
        console.log(`WebSocket error: ${wsError}`);
        setIsLoading(false);
      };

      newWs.onclose = () => {
        console.log("WebSocket connection closed");
        setIsLoading(false);
      };
    } catch (extractionError) {
      toast.error(`Error during frame extraction: ${extractionError}`);
      console.log(`Error during frame extraction: ${extractionError}`);
      setIsLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (ws) {
      ws.close();
      setWs(null);

      setIsLoading(false);
      setResultState({
        frames: [],
        path: null,
        dataSet: [],
        status: null,
        video: null,
      });
      updateCreditInfo();

      toast.success("Ease has been canceled.");
    }
  };

  return (
    <Card
      className={cn(
        "p-6 flex flex-col gap-4",
        theme === "dark" ? "bg-muted" : ""
      )}
    >
      <div className="flex flex-1 gap-6">
        <MotionEaserFrameSequence />
        <Card className="p-3 gap-2 flex flex-1 flex-col overflow-hidden">
          <CardHeader className="p-3 font-bold">
            <CardTitle>Edit the motion ease via the motion graph.</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            <MotionEaserChart ref={chartRef} />
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                The number of mid frames to generate
                <div>
                  <RadioGroup
                    value={frameCount}
                    onValueChange={setFrameCount}
                    defaultValue="1"
                    className="flex space-x-4"
                    disabled={inputFileState.previews.length === 0 || isLoading}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="0" id="frame-count-0" />
                      <Label htmlFor="frame-count-0">+0</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="frame-count-1" />
                      <Label htmlFor="frame-count-1">+1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3" id="frame-count-3" />
                      <Label htmlFor="frame-count-3">+3</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5" id="frame-count-5" />
                      <Label htmlFor="frame-count-5">+5</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="7" id="frame-count-7" />
                      <Label htmlFor="frame-count-7">+7</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-red-600"
                  onClick={handleResetClick}
                  disabled={
                    (inputFileState.path === null &&
                      inputFileState.files.length === 0) ||
                    isLoading
                  }
                >
                  Reset
                </Button>
                <Button
                  className="bg-blue-600"
                  onClick={handleEditAllClick}
                  disabled={
                    (inputFileState.path === null &&
                      inputFileState.files.length === 0) ||
                    isLoading
                  }
                >
                  Edit all scale
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-0 flex flex-col gap-4">
            {showCreditInfo && (
              <Label className="text-red-500 font-bold">
                {showDataSetInfo} credit(s) will be spent, your daily credit
                will be left{" "}
                {100 - creditInfo.limitOfImage - Number(showDataSetInfo)}.
              </Label>
            )}
            {isLoading && resultProgress < 100 && (
              <div className="flex flex-col gap-2 items-center my-5">
                {Math.round(resultProgress)} %
                <div className="w-96">
                  <Progress
                    value={resultProgress}
                    max={100}
                    className={cn("h-3", "[&>div]:bg-blue-500")}
                  />
                </div>
              </div>
            )}

            <div className="w-full flex gap-4">
              {isLoading ? (
                <Button
                  className="flex-1 bg-red-600"
                  onClick={handleCancelClick}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-[#388E3C]"
                  disabled={
                    (inputFileState.path === null &&
                      inputFileState.files.length === 0) ||
                    isLoading
                  }
                  onClick={handleEaseClick}
                >
                  {showCreditInfo ? (
                    <>
                      <PlayIcon className="mr-2" /> Continue Easing
                    </>
                  ) : (
                    <>Ease</>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className="flex gap-6">
        {resultState.frames.length > 0 && (
          <>
            <MotionEaserResult />
            <MotionEaserResultVideo />
          </>
        )}
      </div>
    </Card>
  );
}
