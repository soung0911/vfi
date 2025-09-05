import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreditInfo } from "@/hooks/useCreditInfo";
import { cn } from "@/lib/utils";
import {
  resultIsLoading,
  resultProgressAtom,
} from "@/store/mid-frame-generator-store";
import { PlayIcon } from "@radix-ui/react-icons";
import { useAtomValue } from "jotai";

interface FrameCountSelectorProps {
  frameCount: string;
  setFrameCount: (value: string) => void;
  showCreditInfo: boolean;
  handleGenerateClick: () => void;
}

export default function FrameCountSelector({
  frameCount,
  setFrameCount,
  showCreditInfo,
  handleGenerateClick,
}: FrameCountSelectorProps) {
  const { creditInfo } = useCreditInfo();

  const resultProgress = useAtomValue(resultProgressAtom);
  const isLoading = useAtomValue(resultIsLoading);

  return (
    <Card className="p-6 flex items-center justify-between">
      <div className="flex flex-col gap-4">
        <CardHeader className="p-0">
          <CardTitle>The number of frames to generate</CardTitle>
          <CardDescription>
            You can generate as many mid frames as you choose.
          </CardDescription>
        </CardHeader>
        <div>
          <RadioGroup
            value={frameCount}
            onValueChange={setFrameCount}
            defaultValue="1"
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="frame-count-1" />
              <Label htmlFor="frame-count-1" className="text-base">
                +1
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="frame-count-3" />
              <Label htmlFor="frame-count-3" className="text-base">
                +3
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="5" id="frame-count-5" />
              <Label htmlFor="frame-count-5" className="text-base">
                +5
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="7" id="frame-count-7" />
              <Label htmlFor="frame-count-7" className="text-base">
                +7
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      <div className="flex items-center gap-5">
        {showCreditInfo && (
          <Label className="text-red-500 font-bold">
            {frameCount} credit(s) will be spent, your daily credit will be left{" "}
            {100 - creditInfo.limitOfImage - Number(frameCount)}.
          </Label>
        )}
        {isLoading && resultProgress < 5 && (
          <div className="flex flex-col items-center gap-2">
            {resultProgress * 20}%
            <div className="w-56">
              <Progress
                value={resultProgress * 20}
                max={100}
                className={cn("h-3", "[&>div]:bg-blue-500")}
              />
            </div>
          </div>
        )}
        <Button
          onClick={handleGenerateClick}
          disabled={isLoading}
          className="p-5 text-base bg-[#388E3C]"
        >
          {isLoading ? (
            <>processing...</>
          ) : showCreditInfo ? (
            <>
              <PlayIcon className="mr-2" />
              Continue Generating
            </>
          ) : (
            <>Generate</>
          )}
        </Button>
      </div>
    </Card>
  );
}
