import { useAtom } from "jotai";
import { creditInfoAtom, fetchCreditInfo } from "@/store/user";
import { getCookie } from "cookies-next";

export const useCreditInfo = () => {
  const [creditInfo, setCreditInfo] = useAtom(creditInfoAtom);

  const updateCreditInfo = async () => {
    const username = getCookie("user_name") as string;
    if (username) {
      const newCreditInfo = await fetchCreditInfo(username);
      setCreditInfo((prev) => {
        return { ...newCreditInfo, isShow: prev.isShow };
      });
    }
  };

  const toggleCreditShow = () => {
    setCreditInfo((prev) => {
      return {
        ...prev,
        isShow: !prev.isShow,
      };
    });
  };

  return {
    creditInfo,
    updateCreditInfo,
    isCreditShow: creditInfo.isShow,
    toggleCreditShow,
  };
};
