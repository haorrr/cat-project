// src/components/hooks/service/useGetServices.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useGetServices(filters = {}) {
  const fetchServices = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.category) params.append("category", filters.category);
      if (filters.active_only !== undefined) params.append("active_only", filters.active_only);

      const queryString = params.toString();
      const url = `http://localhost:5000/api/services${queryString ? `?${queryString}` : ""}`;

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
        throw new Error(data.message || "Failed to fetch services");
      }
      return data.data;
    } catch (err) {
      console.error("Error fetching services:", err);
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
    queryKey: ["services", filters],
    queryFn: fetchServices,
    keepPreviousData: true,
  });

  return { 
    services: data?.services, 
    pagination: data?.pagination, 
    isLoading, 
    isError, 
    error, 
    refetch 
  };
}





