import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PauseIcon,
  PlayIcon,
  TrackNextIcon,
  TrackPreviousIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

export default function MotionEaserFrameControls({
  frames,
  selectedIdx,
  setSelectedIdx,
}: {
  frames: string[];
  selectedIdx: number;
  setSelectedIdx: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setSelectedIdx((prev) => {
          return (prev + 1) % frames.length;
        });
      }, 1000 / 10);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, frames, setSelectedIdx]);

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const moveFrame = (direction: number) => {
    setSelectedIdx((prev) => {
      const newIdx = (prev + direction + frames.length) % frames.length;

      return newIdx;
    });
  };

  return (
    <div className="px-4 flex items-center justify-between">
      <div className="flex gap-2">
        <Button onClick={() => moveFrame(-1)} variant="outline">
          <TrackPreviousIcon />
        </Button>
        <Button onClick={togglePlayPause} variant="outline">
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Button onClick={() => moveFrame(1)} variant="outline">
          <TrackNextIcon />
        </Button>
      </div>
      <Label>
        Frame {selectedIdx + 1} / {frames.length}
      </Label>
    </div>
  );
}
