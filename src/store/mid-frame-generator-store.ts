import { atom } from "jotai";

export interface ImageWithPreview {
  file: File;
  preview: string;
}

export interface GenerationResult {
  frames: string[];
  path: string | null;
  status: "start" | "success" | "error" | null;
}

export const startImageAtom = atom<ImageWithPreview | null>(null);
export const endImageAtom = atom<ImageWithPreview | null>(null);
export const resultIsLoading = atom<boolean>(false);
export const resultProgressAtom = atom<number>(0);

export const resultAtom = atom<GenerationResult>({
  frames: [],
  path: null,
  status: null,
});

export const tryResultAtom = atom<GenerationResult>({
  frames: [],
  path: null,
  status: null,
});


export const isTryMoreAtom = atom<boolean>(false);
export const selectedStartIdxAtom = atom<number>(0);
export const selectedEndIdxAtom = atom<number>(0);

export const activeSliderIdAtom = atom<string | null>(null);
