"use client";

import { useState } from "react";
import { Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { use2FALogin } from "../hooks/auth/use2FALogin";
import toast from "react-hot-toast";

export function TwoFALoginModal({ 
  isOpen, 
  onClose, 
  userData, // { user_id, email } from initial login response
}) {
  const [twoFAToken, setTwoFAToken] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);

  const { verify2FALoginMutation, isPending, isError, error } = use2FALogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!twoFAToken) {
      toast.error("Please enter your 2FA code");
      return;
    }

    if (!isBackupCode && twoFAToken.length !== 6) {
      toast.error("2FA code must be 6 digits");
      return;
    }

    if (isBackupCode && twoFAToken.length !== 8) {
      toast.error("Backup code must be 8 characters");
      return;
    }

    verify2FALoginMutation({
      user_id: userData.user_id,
      email: userData.email,
      two_fa_token: twoFAToken.trim(),
    }, {
      onSuccess: () => {
        toast.success("Login successful!");
        onClose();
        setTwoFAToken("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const handleTokenChange = (e) => {
    const value = e.target.value;
    // Auto-detect if it's a backup code (8 chars) or regular token (6 digits)
    setTwoFAToken(value);
    setIsBackupCode(value.length > 6);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app or use a backup code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twofa-code">
              {isBackupCode ? "Backup Code" : "Authentication Code"}
            </Label>
            <Input
              id="twofa-code"
              value={twoFAToken}
              onChange={handleTokenChange}
              placeholder={isBackupCode ? "Enter 8-character backup code" : "Enter 6-digit code"}
              className="text-center text-lg font-mono tracking-wider"
              maxLength={8}
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              {isBackupCode 
                ? "Using backup code (8 characters)"
                : "6-digit code from your authenticator app"
              }
            </p>
          </div>

          {isError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{error?.message}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isPending || !twoFAToken}
              className="w-full"
            >
              {isPending ? "Verifying..." : "Verify & Sign In"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsBackupCode(!isBackupCode);
                  setTwoFAToken("");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                {isBackupCode 
                  ? "Use authenticator code instead" 
                  : "Use backup code instead"
                }
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Lost your device?</strong> Use one of your backup codes to sign in, 
            then disable and re-enable 2FA with your new device.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}