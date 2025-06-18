"use client";

import { useState } from "react";
import { Shield, ShieldCheck, ShieldX, Key, Copy, Download, QrCode, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { use2FAStatus } from "../hooks/auth/use2FAStatus";
import { use2FASetup } from "../hooks/auth/use2FASetup";
import { use2FAVerifySetup } from "../hooks/auth/use2FAVerifySetup";
import { use2FADisable } from "../hooks/auth/use2FADisable";
import { use2FABackupCodes } from "../hooks/auth/use2FABackupCodes";
import toast from "react-hot-toast";

export function TwoFAManagement() {
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [setupStep, setSetupStep] = useState(1); // 1: QR Code, 2: Verification

  const { status, isLoading, is2FAEnabled, refetch } = use2FAStatus();
  const { setup2FAMutation, isPending: isSettingUp, setupData } = use2FASetup();
  const { verifySetup2FAMutation, isPending: isVerifying, verifyData } = use2FAVerifySetup();
  const { disable2FAMutation, isPending: isDisabling } = use2FADisable();
  const { 
    backupCodesCount, 
    regenerateBackupCodesMutation, 
    isRegenerating, 
    newBackupCodes 
  } = use2FABackupCodes();

  // Handle setup 2FA
  const handleSetup2FA = () => {
    setup2FAMutation(undefined, {
      onSuccess: () => {
        setSetupStep(1);
        setShowSetupDialog(true);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  // Handle verify setup
  const handleVerifySetup = () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    verifySetup2FAMutation({ token: verificationToken }, {
      onSuccess: (data) => {
        toast.success("2FA enabled successfully!");
        setShowSetupDialog(false);
        setSetupStep(1);
        setVerificationToken("");
        
        if (data?.backup_codes) {
          setShowBackupCodesDialog(true);
        }
        
        refetch();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  // Handle disable 2FA
  const handleDisable2FA = () => {
    if (!disablePassword) {
      toast.error("Password is required");
      return;
    }

    if (!disableToken || (disableToken.length !== 6 && disableToken.length !== 8)) {
      toast.error("Please enter a valid 2FA token or backup code");
      return;
    }

    disable2FAMutation({ password: disablePassword, token: disableToken }, {
      onSuccess: () => {
        toast.success("2FA disabled successfully");
        setShowDisableDialog(false);
        setDisablePassword("");
        setDisableToken("");
        refetch();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  // Handle regenerate backup codes
  const handleRegenerateBackupCodes = () => {
    const token = prompt("Enter your 2FA code to regenerate backup codes:");
    if (!token) return;

    regenerateBackupCodesMutation({ token }, {
      onSuccess: () => {
        toast.success("Backup codes regenerated successfully");
        setShowBackupCodesDialog(true);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = (codes) => {
    const codesText = codes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success("Backup codes copied to clipboard!");
  };

  // Download backup codes as text file
  const downloadBackupCodes = (codes) => {
    const codesText = codes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded!");
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        {is2FAEnabled ? (
          <ShieldCheck className="h-6 w-6 text-green-500 mr-2" />
        ) : (
          <ShieldX className="h-6 w-6 text-gray-400 mr-2" />
        )}
        <h3 className="text-lg font-semibold text-gray-900">
          Two-Factor Authentication
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium text-gray-900">
              {is2FAEnabled ? "2FA is enabled" : "2FA is disabled"}
            </p>
            <p className="text-sm text-gray-600">
              {is2FAEnabled 
                ? "Your account is protected with two-factor authentication"
                : "Add an extra layer of security to your account"
              }
            </p>
          </div>
          
          <div className="flex space-x-2">
            {is2FAEnabled ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisableDialog(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <ShieldX className="h-4 w-4 mr-1" />
                  Disable
                </Button>
              </>
            ) : (
              <Button
                onClick={handleSetup2FA}
                disabled={isSettingUp}
                className="bg-green-600 hover:bg-green-700"
              >
                <Shield className="h-4 w-4 mr-1" />
                {isSettingUp ? "Setting up..." : "Enable 2FA"}
              </Button>
            )}
          </div>
        </div>

        {/* Backup Codes Section */}
        {is2FAEnabled && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
            <div>
              <p className="font-medium text-gray-900">Backup Codes</p>
              <p className="text-sm text-gray-600">
                You have {backupCodesCount} backup codes remaining
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateBackupCodes}
              disabled={isRegenerating}
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-100"
            >
              <Key className="h-4 w-4 mr-1" />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        )}
      </div>

      {/* Setup 2FA Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {setupStep === 1 
                ? "Scan the QR code with your authenticator app"
                : "Enter the 6-digit code from your authenticator app"
              }
            </DialogDescription>
          </DialogHeader>

          {setupStep === 1 && setupData && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img 
                  src={setupData.qr_code} 
                  alt="2FA QR Code" 
                  className="border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Manual Entry Key</Label>
                <div className="flex space-x-2">
                  <Input
                    value={setupData.secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret);
                      toast.success("Secret copied to clipboard!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setSetupStep(2)} className="w-full">
                  I've Added the Account
                </Button>
              </DialogFooter>
            </div>
          )}

          {setupStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-lg font-mono"
                />
              </div>

              <DialogFooter className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSetupStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifySetup}
                  disabled={isVerifying || verificationToken.length !== 6}
                  className="flex-1"
                >
                  {isVerifying ? "Verifying..." : "Verify & Enable"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password and 2FA code to disable two-factor authentication.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <div className="space-y-2">
              <Label>2FA Code or Backup Code</Label>
              <Input
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value)}
                placeholder="Enter 6-digit code or 8-character backup code"
                className="text-center font-mono"
              />
            </div>

            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">
                This will remove 2FA protection from your account.
              </p>
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false);
                setDisablePassword("");
                setDisableToken("");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDisable2FA}
              disabled={isDisabling || !disablePassword || !disableToken}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isDisabling ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Backup Codes</DialogTitle>
            <DialogDescription>
              Save these backup codes in a safe place. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(verifyData?.backup_codes || newBackupCodes?.backup_codes) && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {(verifyData?.backup_codes || newBackupCodes?.backup_codes).map((code, index) => (
                    <div key={index} className="p-2 bg-white border rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-yellow-700">
                Store these codes safely. You won't be able to see them again.
              </p>
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => copyBackupCodes(verifyData?.backup_codes || newBackupCodes?.backup_codes)}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadBackupCodes(verifyData?.backup_codes || newBackupCodes?.backup_codes)}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}