"use client";

import { postLogin } from "@/apis/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { setCookie } from "cookies-next";
import { SignUpModal } from "@/components/login/sign-up-modal";
import { FindPasswordModal } from "@/components/login/find-password-modal";

export default function Page() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false);

  const handleLoginClick = async () => {
    if (username && password) {
      const data = await postLogin({ user_name: username, password });

      if (data) {
        setCookie("user_name", username, { maxAge: 60 * 60 * 24 * 7 });
        router.push("/main");
      } else {
        toast.error("Please check your username and password.");
      }
    } else {
      toast.error("Please enter both username and password.");
    }
  };

  return (
    <>
      <div className="w-full h-full flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Inshorts AI Motion Traveler v. 0.8 (Beta)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">ID</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={30}
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" onClick={handleLoginClick}>
              Login
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsSignUpOpen(true)}
            >
              Sign Up
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-3">
              Forgot your password?{" "}
              <span
                onClick={() => setIsFindPasswordOpen(true)}
                className="text-primary hover:underline cursor-pointer"
              >
                Find Password
              </span>
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Contact us at{" "}
              <a
                href="mailto:inshortservice@gmail.com"
                className="text-primary hover:underline"
              >
                inshortservice@gmail.com
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
      <SignUpModal isOpen={isSignUpOpen} onOpenChange={setIsSignUpOpen} />
      <FindPasswordModal
        isOpen={isFindPasswordOpen}
        onOpenChange={setIsFindPasswordOpen}
      />
    </>
  );
}
