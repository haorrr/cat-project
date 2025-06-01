// src/components/hooks/news/useGetNewsArticle.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useGetNewsArticle(articleId) {
  const fetchArticle = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/news/${articleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch article");
      }
      return data.data.article;
    } catch (err) {
      console.error("Error fetching article:", err);
      throw err;
    }
  };

  const {
    data: article,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["news-article", articleId],
    queryFn: fetchArticle,
    enabled: !!articleId,
  });

  return { article, isLoading, isError, error, refetch };
}