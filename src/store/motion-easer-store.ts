import { atom } from "jotai";

export interface InputFileState {
  files: File[];
  previews: string[];
  path: string | null;
  fps: number;
  pixfmt: string;
}

export interface ResultState {
  frames: string[];
  path: string | null;
  dataSet: number[];
  status: string | null;
  video: string | null;
}

export const inputFileStateAtom = atom<InputFileState>({
  files: [],
  previews: [],
  path: null,
  fps: 0,
  pixfmt: "",
});

export const resultStateAtom = atom<ResultState>({
  frames: [],
  path: null,
  dataSet: [],
  status: null,
  video: null,
});

export const selectedResultIdxAtom = atom<number>(0);

export const resultProgressAtom = atom<number>(0);

export const activeSliderIdAtom = atom<string | null>(null);
