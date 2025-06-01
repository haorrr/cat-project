// src/components/hooks/food/useGetFoods.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useGetFoods(filters = {}) {
  const fetchFoods = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.category) params.append("category", filters.category);
      if (filters.brand) params.append("brand", filters.brand);
      if (filters.active_only !== undefined) params.append("active_only", filters.active_only);

      const queryString = params.toString();
      const url = `http://localhost:5000/api/foods${queryString ? `?${queryString}` : ""}`;

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
        throw new Error(data.message || "Failed to fetch foods");
      }
      return data.data;
    } catch (err) {
      console.error("Error fetching foods:", err);
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
    queryKey: ["foods", filters],
    queryFn: fetchFoods,
    keepPreviousData: true,
  });

  return { 
    foods: data?.foods, 
    pagination: data?.pagination, 
    isLoading, 
    isError, 
    error, 
    refetch 
  };
}