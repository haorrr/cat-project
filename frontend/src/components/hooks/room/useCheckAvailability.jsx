// src/components/hooks/room/useCheckAvailability.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useCheckAvailability(roomId, startDate, endDate) {
  const checkAvailability = async () => {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });

      const res = await fetch(`http://localhost:5000/api/rooms/${roomId}/availability?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to check availability");
      }
      return data.data;
    } catch (err) {
      console.error("Error checking availability:", err);
      throw err;
    }
  };

  const {
    data: availability,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["room-availability", roomId, startDate, endDate],
    queryFn: checkAvailability,
    enabled: !!(roomId && startDate && endDate),
  });

  return { availability, isLoading, isError, error, refetch };
}