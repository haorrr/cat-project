"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    mutate: loginMutation,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ email, password, two_fa_token }) => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ 
            email, 
            password,
            ...(two_fa_token && { two_fa_token })
          }),
        });

        const data = await res.json();
        
        // If response is successful but requires 2FA
        if (res.ok && data.requires_2fa) {
          return data; // Return the data with requires_2fa flag
        }
        
        // If response is not ok, throw error
        if (!res.ok) {
          throw new Error(data.message || "Login failed");
        }

        return data;
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    onSuccess: (data) => {
      // If 2FA is required, don't proceed with login completion
      if (data.requires_2fa) {
        return; // Let the component handle showing 2FA modal
      }

      // Complete login process
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
      
      router.refresh();
    },
  });

  return { loginMutation, isError, error, isPending };
}