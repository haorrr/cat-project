// src/components/hooks/review/useGetReviews.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useGetReviews(filters = {}) {
  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.rating) params.append("rating", filters.rating);
      if (filters.booking_id) params.append("booking_id", filters.booking_id);
      if (filters.approved_only !== undefined) params.append("approved_only", filters.approved_only);

      const queryString = params.toString();
      const url = `http://localhost:5000/api/reviews${queryString ? `?${queryString}` : ""}`;

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
        throw new Error(data.message || "Failed to fetch reviews");
      }
      return data.data;
    } catch (err) {
      console.error("Error fetching reviews:", err);
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
    queryKey: ["reviews", filters],
    queryFn: fetchReviews,
    keepPreviousData: true,
  });

  return { 
    reviews: data?.reviews, 
    pagination: data?.pagination, 
    isLoading, 
    isError, 
    error, 
    refetch 
  };
}