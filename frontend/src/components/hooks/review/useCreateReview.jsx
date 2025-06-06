"use client";

import { useMutation } from "@tanstack/react-query";

export function useCreateReview() {
  return useMutation({
    mutationFn: async (formData) => {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create review");
      return data.data.review;
    },
  });
}
