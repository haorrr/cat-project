"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

/**
 * Hook đơn giản để xóa phòng
 */
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  const deleteRoom = async (roomId) => {
    // 1. Kiểm tra roomId
    if (!roomId) {
      throw new Error("Room ID is required");
    }

    // 2. Lấy token (required cho admin action)
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    // 3. Gửi DELETE request
    const response = await axios.delete(
      `http://localhost:5000/api/rooms/${roomId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data; // server trả về { success: true, message: "Room deleted successfully" }
  };

  const {
    mutate: deleteRoomMutation,
    isLoading,
    isError,
    error,
    isSuccess,
  } = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      // Invalidate rooms cache để refetch data
      queryClient.invalidateQueries(["rooms"]);
    },
    onError: (error) => {
      console.error("Delete room error:", error);
    },
  });

  return {
    deleteRoomMutation,
    isDeleting: isLoading,
    isError,
    error,
    isSuccess,
  };
}