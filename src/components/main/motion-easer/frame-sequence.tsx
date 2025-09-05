import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  activeSliderIdAtom,
  inputFileStateAtom,
  resultStateAtom,
} from "@/store/motion-easer-store";

import { getCookie } from "cookies-next";
import { useAtom } from "jotai";
import { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import MotionEaserFrameControls from "./frame-controls";
import ImageSlider from "./image-slider";
import { ReloadIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import UTIF from "utif";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";

export default function MotionEaserFrameSequence() {
  const [inputFileState, setInputFileState] = useAtom(inputFileStateAtom);
  const [, setResultState] = useAtom(resultStateAtom);

  const [, setActiveSlider] = useAtom(activeSliderIdAtom);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { isDragging, dragHandlers } = useDragAndDrop({
    onDrop: (files) => handleFiles(files),
    accept: ["image/*", "video/*"],
    multiple: true,
  });

  const extractVideoFrames = async (file: File) => {
    if (file.type === "video/quicktime") {
      const newFile = new File([file], file.name, { type: "video/mp4" });
      file = newFile;
    }

    try {
      setLoading(true);

      const ws = new WebSocket(
        `wss://${process.env.NEXT_PUBLIC_SERVER_URL}/ws/extract-frames`
      );

      ws.onopen = async () => {
        console.log("WebSocket connection established");
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = async () => {
          ws.send(
            JSON.stringify({
              user_name: getCookie("user_name") as string,
            })
          );

          if (reader.result instanceof ArrayBuffer) {
            const videoData = new Uint8Array(reader.result);
            const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks

            for (let i = 0; i < videoData.byteLength; i += CHUNK_SIZE) {
              const chunk = videoData.slice(i, i + CHUNK_SIZE);
              ws.send(chunk);
            }

            ws.send("END");
            console.log("Sent all video data");
          } else {
            toast.error("Failed to read the file as an ArrayBuffer");
            console.log("Failed to read the file as an ArrayBuffer");
          }
        };
      };

      ws.onmessage = async (event) => {
        if (typeof event.data === "string") {
          const data = JSON.parse(event.data);

          if (data.status === "completed") {
            console.log(`FPS set to: ${data.fps}`);

            setInputFileState((prev) => ({
              ...prev,
              path: data.img_path,
              fps: data.fps,
              pixfmt: data.pixfmt,
            }));
          } else if (data.status === "error") {
            toast.error(data.message);
            console.log(`Error: ${data.message}`);
            ws.close();
          }
        } else {
          const frameBlob = new Blob([event.data]);
          const frameUrl = URL.createObjectURL(frameBlob);

          setInputFileState((prev) => ({
            ...prev,
            previews: [...prev.previews, frameUrl],
          }));

          console.log("Received and processed a frame");
        }
      };

      ws.onerror = (wsError) => {
        toast.error(`WebSocket error: ${wsError}`);
        console.log(`WebSocket error: ${wsError}`);
        setLoading(false);
      };

      ws.onclose = () => {
        setLoading(false);
        console.log("WebSocket connection closed");
      };
    } catch (extractionError) {
      toast.error(`Error during frame extraction: ${extractionError}`);
      console.log(`Error during frame extraction: ${extractionError}`);
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setInputFileState((prev) => ({
      ...prev,
      files: [],
      previews: [],
    }));

    const sortedFiles = Array.from(files).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    if (sortedFiles[0].type.startsWith("video/")) {
      if (files.length > 1) {
        toast.error("Only one video file can be selected.");
        return;
      }

      await extractVideoFrames(sortedFiles[0]);
      setInputFileState((prev) => ({
        ...prev,
        files: sortedFiles,
      }));
    } else if (
      sortedFiles.every(
        (file) =>
          file.type.startsWith("image/") ||
          file.name.toLowerCase().endsWith(".tiff") ||
          file.name.toLowerCase().endsWith(".tif")
      )
    ) {
      if (sortedFiles.length < 2 || sortedFiles.length > 120) {
        toast.error("Please select between 2 and 120 image files.");
        return;
      }

      const startTime = performance.now();
      const newPreviews: string[] = [];

      for (const file of sortedFiles) {
        if (
          file.name.toLowerCase().endsWith(".tiff") ||
          file.name.toLowerCase().endsWith(".tif")
        ) {
          const arrayBuffer = await file.arrayBuffer();
          const ifds = UTIF.decode(arrayBuffer);
          UTIF.decodeImage(arrayBuffer, ifds[0]);
          const rgba = UTIF.toRGBA8(ifds[0]);

          const canvas = document.createElement("canvas");
          canvas.width = ifds[0].width;
          canvas.height = ifds[0].height;
          const ctx = canvas.getContext("2d");

          const imgData = ctx!.createImageData(canvas.width, canvas.height);
          imgData.data.set(rgba);
          ctx!.putImageData(imgData, 0, 0);

          newPreviews.push(canvas.toDataURL());
        } else {
          const reader = new FileReader();
          const preview = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          newPreviews.push(preview);
        }
      }

      setInputFileState((prev) => ({
        ...prev,
        files: sortedFiles,
        previews: newPreviews,
      }));

      console.log(
        `Process completed in ${
          (performance.now() - startTime) / 1000
        } seconds.`
      );
    } else {
      toast.error(
        "Invalid file format. Please select video or image files only."
      );
    }
  };

  const handleClearClick = () => {
    setInputFileState({
      files: [],
      previews: [],
      path: null,
      fps: 0,
      pixfmt: "",
    });

    setResultState((prev) => ({
      ...prev,
      frames: [],
      path: null,
      status: null,
      video: null,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card
      className={cn(
        "p-3 gap-2 flex flex-col flex-1 overflow-hidden min-h-[400px] transition-colors",
        isDragging ? "border-2 border-blue-500" : "",
        loading ? "pointer-events-none" : ""
      )}
      onClick={() => setActiveSlider("input")}
      {...dragHandlers}
    >
      <CardHeader className="p-3 flex flex-row items-center justify-between gap-10">
        <div className="flex flex-col gap-2">
          <CardTitle>Frame Sequence</CardTitle>
          <CardDescription>
            Must be images / video more than 2 frames, less than 120 frames. If
            video is more than 120 frames, process slices first 120 frames. If
            the image/video is larger than Full HD, it will be resized to Full
            HD.
          </CardDescription>
        </div>
        <Button
          className="flex-1 bg-red-600"
          onClick={handleClearClick}
          disabled={
            (inputFileState.path === null &&
              inputFileState.files.length === 0) ||
            loading
          }
        >
          Clear
        </Button>
      </CardHeader>

      <CardContent className="p-3 flex-1">
        <Input
          type="file"
          accept="video/*, image/*"
          multiple
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) handleFiles(Array.from(e.target.files));
          }}
          className="hidden"
          ref={fileInputRef}
        />
        {inputFileState.previews.length > 0 ? (
          <>
            {loading && (
              <div className="flex flex-col items-center">
                <ReloadIcon className="w-10 h-10 animate-spin" />
                <span>Loading...</span>
              </div>
            )}

            <ImageSlider
              images={inputFileState.previews}
              selectedIdx={selectedIdx}
              setSelectedIdx={setSelectedIdx}
              sliderId="input"
            />
            <div className="mt-2" />
            <MotionEaserFrameControls
              frames={inputFileState.previews}
              selectedIdx={selectedIdx}
              setSelectedIdx={setSelectedIdx}
            />
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <div
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
              onClick={handleButtonClick}
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="text-center mb-2">
                Drag and drop files here
                <br />
                or click to select
              </p>
              <p className="text-sm text-muted-foreground text-center">
                2-120 image files or 1 video file
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
