// src/components/hooks/auth/useCurrentUser.js
"use client";

import { useQuery } from "@tanstack/react-query";

export function useCurrentUser() {
  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const res = await fetch("http://localhost:5000/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem("token");
          return null;
        }
        throw new Error("Failed to fetch user data");
      }

      const data = await res.json();
      return data.user || data;
    } catch (err) {
      console.error("Error fetching current user:", err);
      // If there's an error, remove the token and return null
      localStorage.removeItem("token");
      return null;
    }
  };

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  });
}