import React, { useCallback } from "react";
import Image from "next/image"; // Next.js의 Image 컴포넌트 가져오기
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  endImageAtom,
  startImageAtom,
} from "@/store/mid-frame-generator-store";
import { useAtom } from "jotai";
import UTIF from "utif";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";

interface ImageCardProps {
  type: "start" | "end";
}

export default function ImageCard({ type }: ImageCardProps) {
  const [startImage, setStartImage] = useAtom(startImageAtom);
  const [endImage, setEndImage] = useAtom(endImageAtom);

  const { isDragging, dragHandlers } = useDragAndDrop({
    onDrop: (files) => handleFile(files[0]),
    accept: ["image/*"],
    multiple: false,
  });

  const handleFile = useCallback(
    (file: File) => {
      if (file) {
        const isTiff =
          file.name.toLowerCase().endsWith(".tiff") ||
          file.name.toLowerCase().endsWith(".tif");

        if (isTiff) {
          // TIFF 파일 처리
          const reader = new FileReader();
          reader.onload = () => {
            const buffer = reader.result as ArrayBuffer;
            const ifds = UTIF.decode(buffer);
            UTIF.decodeImage(buffer, ifds[0]); // 첫 번째 이미지 프레임 디코딩
            const rgba = UTIF.toRGBA8(ifds[0]); // RGBA 형식으로 변환

            // Canvas 생성 및 이미지 데이터 그리기
            const canvas = document.createElement("canvas");
            canvas.width = ifds[0].width;
            canvas.height = ifds[0].height;
            const ctx = canvas.getContext("2d");

            if (ctx) {
              const imgData = ctx.createImageData(canvas.width, canvas.height);
              for (let i = 0; i < rgba.length; i++) {
                imgData.data[i] = rgba[i];
              }
              ctx.putImageData(imgData, 0, 0);

              const preview = canvas.toDataURL();

              if (type === "start") {
                setStartImage({
                  file,
                  preview,
                });
              } else {
                setEndImage({
                  file,
                  preview,
                });
              }
            }
          };
          reader.readAsArrayBuffer(file);
        } else if (file.type.substr(0, 5) === "image") {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (type === "start") {
              setStartImage({
                file,
                preview: reader.result as string,
              });
            } else {
              setEndImage({
                file,
                preview: reader.result as string,
              });
            }
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [type, setStartImage, setEndImage]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <Card
      className={`p-3 min-h-60 transition-colors ${
        isDragging ? "border-2 border-blue-500 " : ""
      }`}
      {...dragHandlers}
    >
      <CardHeader className="p-3">
        <CardTitle>{type === "start" ? "Start image" : "End image"}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        {(type === "start" ? startImage?.preview : endImage?.preview) ? (
          <div className="relative w-full h-auto aspect-video overflow-hidden">
            <Image
              src={
                (type === "start"
                  ? startImage?.preview
                  : endImage?.preview) as string
              }
              alt={`${type}-preview`}
              fill
              className="object-contain"
            />
            <Button
              className="absolute top-2 right-2 rounded-full w-6 h-6 bg-red-500"
              size="icon"
              onClick={() =>
                type === "start" ? setStartImage(null) : setEndImage(null)
              }
            >
              <Cross2Icon className="w-4 h-4 stroke-2" />
            </Button>
          </div>
        ) : (
          <div className="h-auto flex flex-col items-center justify-around">
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <svg
                  className="w-8 h-8 text-gray-400"
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
                <Label className="text-center leading-5">
                  Drag and drop image here
                  <br />
                  or click to select
                </Label>
                <Label className="text-sm text-muted-foreground mt-3">
                  Insert {type} image ({type === "start" ? "left" : "right"})
                  for generation of middle frame(s)
                </Label>
                <Label className="text-sm text-muted-foreground">
                  If the image/video is larger than Full HD, it will be resized
                  to Full HD.
                </Label>
              </div>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
