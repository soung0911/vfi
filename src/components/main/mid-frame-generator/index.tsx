import { postUploadFrames } from "@/apis/api";
import { Card } from "@/components/ui/card";
import {
  endImageAtom,
  isTryMoreAtom,
  resultAtom,
  resultIsLoading,
  resultProgressAtom,
  selectedEndIdxAtom,
  selectedStartIdxAtom,
  startImageAtom,
  tryResultAtom,
} from "@/store/mid-frame-generator-store";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { toast } from "sonner";
import { getCookie } from "cookies-next";
import { useCreditInfo } from "@/hooks/useCreditInfo";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import ImageCard from "./image-card";
import MidFrameGeneratorTryMoreControls from "./controls/try-more-controls";
import MidFrameGeneratorControls from "./controls/base-controls";
import UTIF from "utif";

export default function MidFrameGenerator() {
  const { theme } = useTheme();
  const { updateCreditInfo } = useCreditInfo();

  const selectedStartIdx = useAtomValue(selectedStartIdxAtom);
  const selectedEndIdx = useAtomValue(selectedEndIdxAtom);

  const [result, setResult] = useAtom(resultAtom);
  const [, setTryResult] = useAtom(tryResultAtom);

  const setResultProgress = useSetAtom(resultProgressAtom);
  const setIsLoading = useSetAtom(resultIsLoading);

  const [isTryMore, setIsTryMore] = useAtom(isTryMoreAtom);
  const [startImage, setStartImage] = useAtom(startImageAtom);
  const [endImage, setEndImage] = useAtom(endImageAtom);

  const [frameCount, setFrameCount] = useState("1");
  const [selectedResultIdx, setSelectedResultIdx] = useState(0);
  const [selectedTryResultIdx, setSelectedTryResultIdx] = useState(0);

  const generateMidFrames = async ({
    user_name,
    img_path,
    index,
    number,
    extv,
    setResultState,
  }: {
    user_name: string;
    img_path: string;
    index: number[];
    number: number;
    extv: string;
    setResultState: typeof setResult;
  }) => {
    try {
      const ws = new WebSocket(
        `wss://${process.env.NEXT_PUBLIC_SERVER_URL}/ws/vfi-service-index`
      );

      ws.onopen = async () => {
        ws.send(
          JSON.stringify({
            user_name,
            img_path,
            index,
            number,
            extv,
          })
        );
        ws.send("END");
      };

      ws.onmessage = async (event) => {
        if (typeof event.data === "string") {
          const data = JSON.parse(event.data);

          if (data.status === "start process" || data.status === "processing") {
            setResultProgress(data.progressbar);
          } else if (data.status === "completed") {
            setResultState((prev) => ({
              ...prev,
              path: data.img_path,
              status: "success",
            }));

            updateCreditInfo();
          } else if (data.status === "error") {
            setResultState((prev) => ({
              ...prev,
              frames: [],
              status: "error",
            }));

            toast.error(data.message);
            console.log(`Error: ${data.message}`);
            ws.close();
          }
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            const buffer = reader.result as ArrayBuffer;
            const frameData = buffer.slice(4);

            const blobOptions = {
              type:
                extv === "tiff" || extv === "tif" ? "image/tiff" : "image/jpeg",
            };

            const frameBlob = new Blob([frameData], blobOptions);

            if (extv === "tiff" || extv === "tif") {
              const tiffReader = new FileReader();
              tiffReader.onload = () => {
                const tiffBuffer = tiffReader.result as ArrayBuffer;
                const ifds = UTIF.decode(tiffBuffer);
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

                  const jpegUrl = canvas.toDataURL("image/jpeg", 0.9);

                  setResultState((prev) => ({
                    ...prev,
                    frames: [...prev.frames, jpegUrl],
                  }));
                }
              };
              tiffReader.readAsArrayBuffer(frameBlob);
            } else {
              const frameUrl = URL.createObjectURL(frameBlob);

              setResultState((prev) => ({
                ...prev,
                frames: [...prev.frames, frameUrl],
              }));
            }
          };
          reader.readAsArrayBuffer(event.data);

          console.log("Received and processed a frame");
        }
      };

      ws.onerror = (wsError) => {
        toast.error(`WebSocket error: ${wsError}`);
        console.log(`WebSocket error: ${wsError}`);
        setIsLoading(false);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        setIsLoading(false);
      };
    } catch (extractionError) {
      toast.error(`Error during frame extraction: ${extractionError}`);
      console.log(`Error during frame extraction: ${extractionError}`);
      setIsLoading(false);
    }
  };

  const handleGenerateClick = async () => {
    if (!startImage || !endImage) {
      return;
    }

    setIsLoading(true);

    if (isTryMore) {
      setTryResult((prev) => ({
        ...prev,
        frames: [],
      }));
      setSelectedTryResultIdx(0);

      await generateMidFrames({
        user_name: getCookie("user_name") as string,
        img_path: result.path as string,
        index: [selectedStartIdx, selectedEndIdx],
        number: Number(frameCount),
        extv: startImage.file.name.split(".")[1],
        setResultState: setTryResult,
      });
    } else {
      const formData = new FormData();
      formData.append("files", startImage.file, "0_" + startImage.file.name);
      formData.append("files", endImage.file, "1_" + endImage.file.name);
      formData.append("extv", startImage.file.type.split("/")[1]);

      const data = await postUploadFrames(formData);

      setResult((prev) => ({
        ...prev,
        frames: [],
      }));
      setSelectedResultIdx(0);

      await generateMidFrames({
        user_name: getCookie("user_name") as string,
        img_path: data,
        index: [0, 1],
        number: Number(frameCount),
        extv: startImage.file.name.split(".")[1],
        setResultState: setResult,
      });
    }
  };

  const handleClearClick = () => {
    setStartImage(null);
    setEndImage(null);
    setSelectedResultIdx(0);
    setSelectedTryResultIdx(0);
    setIsTryMore(false);
    setResultProgress(0);

    setResult((prev) => ({
      ...prev,
      frames: [],
      path: null,
      status: null,
    }));
    setTryResult((prev) => ({
      ...prev,
      frames: [],
      path: null,
      status: null,
    }));
  };

  return (
    <Card
      className={cn(
        "p-6 flex flex-col gap-4",
        theme === "dark" ? "bg-muted" : ""
      )}
    >
      <div className="flex gap-6">
        <div className="flex-1 flex flex-col gap-2">
          <ImageCard type="start" />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <ImageCard type="end" />
        </div>
      </div>

      {isTryMore ? (
        <MidFrameGeneratorTryMoreControls
          frameCount={frameCount}
          setFrameCount={setFrameCount}
          onGenerate={handleGenerateClick}
          selectedIdx={selectedTryResultIdx}
          setSelectedIdx={setSelectedTryResultIdx}
          onClear={handleClearClick}
        />
      ) : (
        <MidFrameGeneratorControls
          frameCount={frameCount}
          setFrameCount={setFrameCount}
          onGenerate={handleGenerateClick}
          selectedIdx={selectedResultIdx}
          setSelectedIdx={setSelectedResultIdx}
          onClear={handleClearClick}
        />
      )}
    </Card>
  );
}
