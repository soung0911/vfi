import { postDownloadFrames } from "@/apis/api";

export const downloadFrame = async ({
  img_path,
  index,
}: {
  img_path: string;
  index: string;
}) => {
  const data = await postDownloadFrames({
    img_path,
    index,
  });

  const downloadUrl = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = downloadUrl;

  link.download = `result_frame_${index}.${data.type.split("/")[1]}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
