import { postSignUp, postSendEmail, postVerifyEmail } from "@/apis/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

interface SignUpModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignUpModal({ isOpen, onOpenChange }: SignUpModalProps) {
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [company, setCompany] = useState("");
  const [nickname, setNickname] = useState("");

  const handleSendEmail = async () => {
    if (!signUpEmail) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      await postSendEmail({ email: signUpEmail });
      toast.success("Verification email has been sent.");
      setCountdown(60);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Start new timer
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error("Failed to send verification email.");
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code.");
      return;
    }

    try {
      const response = await postVerifyEmail({
        email: signUpEmail,
        checknum: Number(verificationCode),
      });

      if (response) {
        setIsEmailVerified(true);
        toast.success("Email verification completed.");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          setCountdown(0);
        }
      } else {
        toast.error("Invalid verification code.");
      }
    } catch {
      toast.error("Email verification failed.");
    }
  };

  const handleSignUp = async () => {
    if (
      !signUpUsername ||
      !signUpPassword ||
      !isEmailVerified ||
      !company ||
      !nickname
    ) {
      toast.error("Please fill in all fields and complete email verification.");
      return;
    }

    const response = await postSignUp({
      user_name: signUpUsername,
      password: signUpPassword,
      email: signUpEmail,
      others: JSON.stringify({ company, nickname }),
    });

    if (response) {
      toast.success("Sign up completed successfully.");
      onOpenChange(false);
    } else {
      toast.error("Sign up failed.");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const isValidVerificationCode = (code: string) => {
    return code.length === 6 && /^\d+$/.test(code);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Up</DialogTitle>
          <DialogDescription>Create a new account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="signUpUsername">ID</Label>
            <Input
              id="signUpUsername"
              value={signUpUsername}
              onChange={(e) => setSignUpUsername(e.target.value)}
              disabled={isEmailVerified}
              maxLength={30}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="signUpPassword">Password</Label>
            <Input
              id="signUpPassword"
              type="password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              disabled={isEmailVerified}
              maxLength={30}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isEmailVerified}
              maxLength={30}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={isEmailVerified}
              maxLength={30}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="signUpEmail">Email</Label>
            <div className="flex gap-2">
              <Input
                id="signUpEmail"
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                disabled={isEmailVerified}
              />
              <Button
                onClick={handleSendEmail}
                disabled={
                  !isValidEmail(signUpEmail) || countdown > 0 || isEmailVerified
                }
                className="flex-shrink-0"
              >
                {isEmailVerified
                  ? "Verified"
                  : countdown > 0
                  ? `${countdown}s`
                  : "Send Code"}
              </Button>
            </div>
            {signUpEmail && !isValidEmail(signUpEmail) && !isEmailVerified && (
              <span className="text-sm text-red-500">
                Please enter a valid email address
              </span>
            )}
          </div>

          {signUpEmail && !isEmailVerified && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <div className="flex gap-2">
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.slice(0, 6))
                  }
                  placeholder="6-digit code"
                  maxLength={6}
                  disabled={isEmailVerified}
                />
                <Button
                  onClick={handleVerifyEmail}
                  disabled={
                    !isValidVerificationCode(verificationCode) ||
                    isEmailVerified
                  }
                >
                  Verify
                </Button>
              </div>
            </div>
          )}
        </div>
        <Button
          onClick={handleSignUp}
          disabled={
            !signUpUsername ||
            !signUpPassword ||
            !isEmailVerified ||
            !company ||
            !nickname
          }
          className={isEmailVerified ? "bg-green-500 hover:bg-green-600" : ""}
        >
          Sign Up
        </Button>
      </DialogContent>
    </Dialog>
  );
}
