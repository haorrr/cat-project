"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function use2FADisable() {
  const queryClient = useQueryClient();

  const disable2FA = async ({ password, token }) => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("Access token is required");
    }

    const res = await fetch("http://localhost:5000/api/2fa/disable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ password, token }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to disable 2FA");
    }

    return data;
  };

  const {
    mutate: disable2FAMutation,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: disable2FA,
    onSuccess: () => {
      // Refresh 2FA status and user data after disabling
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  return { 
    disable2FAMutation, 
    isPending, 
    isError, 
    error, 
    isSuccess 
  };
}