"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

export function use2FABackupCodes() {
  // Hook for getting backup codes count
  const getBackupCodesCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Access token is required");
    }

    const res = await fetch("http://localhost:5000/api/2fa/backup-codes-count", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to get backup codes count");
    }

    return data.data;
  };

  // Hook for regenerating backup codes
  const regenerateBackupCodes = async ({ token }) => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      throw new Error("Access token is required");
    }

    const res = await fetch("http://localhost:5000/api/2fa/regenerate-backup-codes", {
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
      throw new Error(data.message || "Failed to regenerate backup codes");
    }

    return data.data;
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Query for backup codes count
  const {
    data: backupCodesCount,
    isLoading: isLoadingCount,
    refetch: refetchCount,
  } = useQuery({
    queryKey: ["2fa-backup-codes-count"],
    queryFn: getBackupCodesCount,
    enabled: !!token,
    retry: false,
  });

  // Mutation for regenerating backup codes
  const {
    mutate: regenerateBackupCodesMutation,
    isPending: isRegenerating,
    isError,
    error,
    isSuccess,
    data: newBackupCodes,
  } = useMutation({
    mutationFn: regenerateBackupCodes,
    onSuccess: () => {
      refetchCount();
    },
  });

  return {
    backupCodesCount: backupCodesCount?.remaining_backup_codes || 0,
    isLoadingCount,
    refetchCount,
    regenerateBackupCodesMutation,
    isRegenerating,
    isError,
    error,
    isSuccess,
    newBackupCodes,
  };
}