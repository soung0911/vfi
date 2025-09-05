import { atom } from "jotai";
import { getCredit } from "@/apis/api";

export const creditInfoAtom = atom({
  isShow: false,
  limitOfRun: 0,
  limitOfImage: 0,
});

export const fetchCreditInfo = async (
  username: string
): Promise<{
  isShow: false;
  limitOfRun: number;
  limitOfImage: number;
}> => {
  try {
    const data = await getCredit({ user_name: username });
    return { isShow: false, limitOfRun: data[0], limitOfImage: data[1] };
  } catch (error) {
    console.error("크레딧 정보를 가져오는데 실패했습니다:", error);
    return { isShow: false, limitOfRun: 0, limitOfImage: 0 };
  }
};
