// src/components/hooks/dashboard/useDashboardStats.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useDashboardStats() {
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch multiple endpoints in parallel
      const [catsRes, bookingsRes] = await Promise.all([
        fetch("http://localhost:5000/api/cats?limit=5&active_only=true", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include",
        }),
        fetch("http://localhost:5000/api/bookings?limit=5", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include",
        })
      ]);

      const [catsData, bookingsData] = await Promise.all([
        catsRes.json(),
        bookingsRes.json()
      ]);

      return {
        cats: catsData.success ? catsData.data.cats : [],
        bookings: bookingsData.success ? bookingsData.data.bookings : [],
        catsTotal: catsData.data?.pagination?.total_records || 0,
        bookingsTotal: bookingsData.data?.pagination?.total_records || 0
      };
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
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
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
  });

  return { 
    stats: data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  };
}