// src/components/hooks/room/useGetRoom.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useGetRoom(roomId) {
  const fetchRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch room");
      }
      return data.data.room;
    } catch (err) {
      console.error("Error fetching room:", err);
      throw err;
    }
  };

  const {
    data: room,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["room", roomId],
    queryFn: fetchRoom,
    enabled: !!roomId,
  });

  return { room, isLoading, isError, error, refetch };
}

