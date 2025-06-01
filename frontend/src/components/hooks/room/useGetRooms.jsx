// src/components/hooks/room/useGetRooms.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useGetRooms(filters = {}) {
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.room_type) params.append("room_type", filters.room_type);
      if (filters.min_price) params.append("min_price", filters.min_price);
      if (filters.max_price) params.append("max_price", filters.max_price);
      if (filters.check_in) params.append("check_in", filters.check_in);
      if (filters.check_out) params.append("check_out", filters.check_out);
      if (filters.available_only !== undefined) params.append("available_only", filters.available_only);

      const queryString = params.toString();
      const url = `http://localhost:5000/api/rooms${queryString ? `?${queryString}` : ""}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch rooms");
      }
      return data.data;
    } catch (err) {
      console.error("Error fetching rooms:", err);
      throw err;
    }
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["rooms", filters],
    queryFn: fetchRooms,
    keepPreviousData: true,
  });

  return { 
    rooms: data?.rooms, 
    pagination: data?.pagination, 
    isLoading, 
    isError, 
    error, 
    refetch 
  };
}

