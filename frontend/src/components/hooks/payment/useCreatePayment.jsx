// src/components/hooks/payment/useCreatePayment.jsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreatePayment() {
  const queryClient = useQueryClient();

  const createPayment = async (paymentData) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify(paymentData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to process payment");
      }
      return data.data.payment;
    } catch (err) {
      console.error("Error processing payment:", err);
      throw err;
    }
  };

  const {
    mutate: createPaymentMutation,
    isLoading,
    isError,
    error,
    isSuccess,
    data: payment,
  } = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries(["payments"]);
      queryClient.invalidateQueries(["bookings"]);
    },
  });

  return { createPaymentMutation, isLoading, isError, error, isSuccess, payment };
}