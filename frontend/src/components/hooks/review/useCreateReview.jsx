// src/components/hooks/review/useCreateReview.jsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateReview() {
  const queryClient = useQueryClient();

  const createReview = async (reviewData) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify(reviewData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create review");
      }
      return data.data.review;
    } catch (err) {
      console.error("Error creating review:", err);
      throw err;
    }
  };

  const {
    mutate: createReviewMutation,
    isLoading,
    isError,
    error,
    isSuccess,
    data: review,
  } = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      queryClient.invalidateQueries(["reviews"]);
    },
  });

  return { createReviewMutation, isLoading, isError, error, isSuccess, review };
}