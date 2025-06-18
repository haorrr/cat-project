"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function use2FASetup() {
  const queryClient = useQueryClient();

  const setup2FA = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Access token is required");
    }

    const res = await fetch("http://localhost:5000/api/2fa/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to setup 2FA");
    }

    return data.data;
  };

  const {
    mutate: setup2FAMutation,
    isPending,
    isError,
    error,
    isSuccess,
    data: setupData,
  } = useMutation({
    mutationFn: setup2FA,
    onSuccess: () => {
      // Refresh 2FA status after setup
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
  });

  return { 
    setup2FAMutation, 
    isPending, 
    isError, 
    error, 
    isSuccess, 
    setupData 
  };
}