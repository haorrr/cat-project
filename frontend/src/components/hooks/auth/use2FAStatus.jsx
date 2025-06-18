"use client";

import { useQuery } from "@tanstack/react-query";

export function use2FAStatus() {
  const fetch2FAStatus = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      throw new Error("Access token is required");
    }

    const res = await fetch("http://localhost:5000/api/2fa/status", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch 2FA status");
    }

    return data.data;
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const {
    data: status,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["2fa-status"],
    queryFn: fetch2FAStatus,
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return { 
    status, 
    isLoading, 
    isError, 
    error, 
    refetch,
    is2FAEnabled: status?.two_fa_enabled || false,
    hasSecret: status?.has_secret || false
  };
}