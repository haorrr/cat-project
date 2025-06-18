"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function use2FAVerifySetup() {
  const queryClient = useQueryClient();

  const verifySetup2FA = async ({ token }) => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("Access token is required");
    }

    const res = await fetch("http://localhost:5000/api/2fa/verify-setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to verify 2FA setup");
    }

    return data.data;
  };

  const {
    mutate: verifySetup2FAMutation,
    isPending,
    isError,
    error,
    isSuccess,
    data: verifyData,
  } = useMutation({
    mutationFn: verifySetup2FA,
    onSuccess: () => {
      // Refresh 2FA status and user data after successful verification
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  return { 
    verifySetup2FAMutation, 
    isPending, 
    isError, 
    error, 
    isSuccess, 
    verifyData 
  };
}