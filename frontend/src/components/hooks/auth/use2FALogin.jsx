"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function use2FALogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const verify2FALogin = async ({ user_id, email, two_fa_token }) => {
    const res = await fetch("http://localhost:5000/api/auth/verify-2fa-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ user_id, email, two_fa_token }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "2FA verification failed");
    }

    return data;
  };

  const {
    mutate: verify2FALoginMutation,
    isPending,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: verify2FALogin,
    onSuccess: (data) => {
      const { token, user } = data.data;

      // Save token to localStorage
      localStorage.setItem("token", token);

      // Update user cache
      queryClient.setQueryData(["currentUser"], user);

      // Redirect based on user role
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    },
  });

  return {
    verify2FALoginMutation,
    isPending,
    isError,
    error,
    isSuccess,
  };
}