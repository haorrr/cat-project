"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useChangePassword } from "../hooks/auth/useChangePassword";
import { use2FAStatus } from "../hooks/auth/use2FAStatus";
import toast from "react-hot-toast";

// Schema validation
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(6, "New password must be at least 6 characters long"),
    two_fa_token: z.string().optional(),
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [showTwoFAField, setShowTwoFAField] = useState(false);
  
  const { changePasswordMutation, isPending, isError, error, isSuccess } = useChangePassword();
  const { is2FAEnabled } = use2FAStatus();

  // Form initialization
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      two_fa_token: "",
    },
  });

  // Handle form submission
  const onSubmit = (data) => {
    changePasswordMutation(data, {
      onSuccess: () => {
        toast.success("Password changed successfully!");
        setOpen(false);
        form.reset();
        setShowTwoFAField(false);
      },
      onError: (error) => {
        // Check if 2FA is required
        if (error.message.includes("2FA token is required") || error.message.includes("requires_2fa")) {
          setShowTwoFAField(true);
          toast.error("2FA verification required");
        } else {
          toast.error(error.message);
        }
      },
    });
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
      setShowTwoFAField(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-yellow-500 cursor-pointer border-yellow-500">
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
            {is2FAEnabled && " 2FA verification may be required."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Current password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="New password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2FA Token Field - Show if 2FA is enabled or if required by error */}
            {(is2FAEnabled || showTwoFAField) && (
              <FormField
                control={form.control}
                name="two_fa_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      2FA Code {showTwoFAField && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="6-digit code or 8-character backup code" 
                        className="text-center font-mono"
                        maxLength={8}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500">
                      Enter your authenticator code or backup code
                    </p>
                  </FormItem>
                )}
              />
            )}

            {/* Error Display */}
            {isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error?.message}</p>
              </div>
            )}

            {/* Success Display */}
            {isSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">Password changed successfully!</p>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}