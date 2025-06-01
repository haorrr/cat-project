// src/components/hooks/news/useGetNews.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useGetNews(filters = {}) {
  const fetchNews = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.category) params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);
      if (filters.published_only !== undefined) params.append("published_only", filters.published_only);

      const queryString = params.toString();
      const url = `http://localhost:5000/api/news${queryString ? `?${queryString}` : ""}`;

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
        throw new Error(data.message || "Failed to fetch news");
      }
      return data.data;
    } catch (err) {
      console.error("Error fetching news:", err);
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
    queryKey: ["news", filters],
    queryFn: fetchNews,
    keepPreviousData: true,
  });

  return { 
    news: data?.news, 
    pagination: data?.pagination, 
    isLoading, 
    isError, 
    error, 
    refetch 
  };
}