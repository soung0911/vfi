import axios from "axios";

export const URL = `https://${process.env.NEXT_PUBLIC_SERVER_URL}`;

const apiClient = axios.create({
  baseURL: `${URL}`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const postLogin = async (params: {
  user_name: string;
  password: string;
}) => {
  const { data } = await apiClient.post("/login-id", params);
  return data;
};

export const postFindPassword = async (params: {
  user_name: string;
  email: string;
}) => {
  const { data } = await apiClient.post("/find-pw", params);
  return data;
};

export const postSignUp = async (params: {
  user_name: string;
  password: string;
  email: string;
  others: string;
}) => {
  const { data } = await apiClient.post("/make-idpw", params);
  return data;
};

export const postSendEmail = async (params: { email: string }) => {
  const { data } = await apiClient.post("/send-mail", params);
  return data;
};

export const postVerifyEmail = async (params: {
  email: string;
  checknum: number;
}) => {
  const { data } = await apiClient.post("/check-num", params);
  return data;
};

export const getCredit = async (params: { user_name: string }) => {
  const { data } = await apiClient.post("/load-credit", params);
  return data;
};

export const postUploadFrames = async (params: FormData) => {
  const { data } = await apiClient.post("/upload-frames", params, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const postDownloadFrames = async (params: {
  img_path: string;
  index: string;
}) => {
  const { data } = await apiClient.post("/download-frame", params, {
    responseType: "blob",
  });
  return data;
};

export const postDownloadZip = async (params: { img_path: string }) => {
  const { data } = await apiClient.post("/download-total", params, {
    responseType: "blob",
  });
  return data;
};

export const postDownloadVideo = async (params: {
  img_path: string;
  fps: number;
  pixfmt: string;
  videoext: string;
}) => {
  const { data } = await apiClient.post("/download-video", params, {
    responseType: "blob",
  });

  return data;
};
