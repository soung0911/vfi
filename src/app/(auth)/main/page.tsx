"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoonIcon, PersonIcon, SunIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { deleteCookie } from "cookies-next";
import { useEffect } from "react";
import { useCreditInfo } from "@/hooks/useCreditInfo";
import MidFrameGenerator from "@/components/main/mid-frame-generator";
import MotionEaser from "@/components/main/motion-easer";

export default function Page() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { creditInfo, updateCreditInfo, isCreditShow, toggleCreditShow } =
    useCreditInfo();

  useEffect(() => {
    updateCreditInfo();
  }, []);

  const handleLogoutClick = () => {
    deleteCookie("user_name");
    router.push("/login");
    window.location.reload();
  };

  const handleContactClick = () => {
    window.open("https://forms.gle/bmwAqWpz5NjKZMay9");
  };

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleShowCreditClick = () => {
    toggleCreditShow();
  };

  return (
    <div className="h-full flex">
      <div className="flex flex-[80_1_0px] flex-col overflow-hidden">
        <header className="h-[64px] border-b flex ">
          <div className="w-full flex items-center justify-between px-6">
            <div>Inshorts AI Motion Traveler v. 0.8 (Beta)</div>
            <div className="flex gap-6 items-center">
              {isCreditShow && (
                <div className="text-sm font-medium">
                  Limit of Run (50/day): {50 - creditInfo.limitOfRun} / Limit of
                  Image (100/day): {100 - creditInfo.limitOfImage}
                </div>
              )}

              <Button variant="ghost" size="icon" onClick={handleThemeToggle}>
                {theme === "light" ? (
                  <SunIcon className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
                )}
              </Button>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                    >
                      <PersonIcon className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-32 mr-5">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={handleShowCreditClick}>
                        {isCreditShow ? "Hide" : "Show"} Credits
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={handleContactClick}>
                        Contact
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogoutClick}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          <Tabs defaultValue="generator" className="w-full">
            <TabsList>
              <TabsTrigger value="generator">
                (Image) Mid Frame Generator
              </TabsTrigger>
              <TabsTrigger value="easer">(Sequence) Motion Easer</TabsTrigger>
            </TabsList>
            <TabsContent value="generator" className="w-full h-auto">
              <MidFrameGenerator />
            </TabsContent>
            <TabsContent value="easer" className="w-full h-auto">
              <MotionEaser />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      {/* <ServerStatus /> */}
    </div>
  );
}
