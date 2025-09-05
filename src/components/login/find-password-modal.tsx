import { postFindPassword } from "@/apis/api";
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
import { useState } from "react";
import { toast } from "sonner";

interface FindPasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FindPasswordModal({
  isOpen,
  onOpenChange,
}: FindPasswordModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const isValidEmail = (email: string) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleFindPassword = async () => {
    if (!username || !email) {
      toast.error("Please check your username and email.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      await postFindPassword({ user_name: username, email });
      toast.success("Password is sent to your email.");
      setUsername("");
      setEmail("");
      onOpenChange(false);
    } catch {
      toast.error("Please check your username and email.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Find Password</DialogTitle>
          <DialogDescription>
            Enter your ID and email address to receive your password by email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">ID</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && !isValidEmail(email) && (
              <span className="text-sm text-red-500">
                Please enter a valid email address
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={handleFindPassword}
          disabled={!username || !email || !isValidEmail(email)}
        >
          Send Password Email
        </Button>
      </DialogContent>
    </Dialog>
  );
}
