// src/components/hooks/payment/useGetPayments.jsx
"use client";

import { useQuery } from "@tanstack/react-query";

export function useGetPayments(filters = {}) {
  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.booking_id) params.append("booking_id", filters.booking_id);
      if (filters.payment_status) params.append("payment_status", filters.payment_status);
      if (filters.payment_method) params.append("payment_method", filters.payment_method);

      const queryString = params.toString();
      const url = `http://localhost:5000/api/payments${queryString ? `?${queryString}` : ""}`;

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
        throw new Error(data.message || "Failed to fetch payments");
      }
      return data.data;
    } catch (err) {
      console.error("Error fetching payments:", err);
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
    queryKey: ["payments", filters],
    queryFn: fetchPayments,
    keepPreviousData: true,
  });

  return { 
    payments: data?.payments, 
    pagination: data?.pagination, 
    isLoading, 
    isError, 
    error, 
    refetch 
  };
}