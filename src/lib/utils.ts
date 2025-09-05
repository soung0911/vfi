import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeToSeconds(timeString: string): number {
  const parts = timeString.split(":").map(Number);
  if (parts.length === 3) {
    // 시:분:초 형식
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // 분:초 형식
    return parts[0] * 60 + parts[1];
  } else {
    // 잘못된 형식
    console.error("Invalid time format:", timeString);
    return 0;
  }
}
