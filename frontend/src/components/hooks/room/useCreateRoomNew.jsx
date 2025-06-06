"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

/**
 * roomData: {
 *   name: string,
 *   description: string,
 *   room_type: string,
 *   capacity: number,
 *   price_per_day: number,
 *   amenities: string[],      // mảng chuỗi, ví dụ: ["Wi-Fi", "Gym", ...]
 *   size_sqm: number,
 *   images: File[]            // mảng File object từ input[type="file"]
 * }
 */
export function useCreateRoom() {
  const queryClient = useQueryClient();

  const createRoom = async (roomData) => {
    // 1. Tạo FormData
    const formData = new FormData();
    formData.append("name", roomData.name);
    formData.append("description", roomData.description);
    formData.append("room_type", roomData.room_type);
    formData.append("capacity", roomData.capacity);
    formData.append("price_per_day", roomData.price_per_day);
    formData.append("size_sqm", roomData.size_sqm);

    // amenities: chuyển mảng thành chuỗi JSON
    formData.append("amenities", JSON.stringify(roomData.amenities || []));

    // Đảm bảo append đúng key "images" tương ứng upload.array("images", 10) ở server
    roomData.images.forEach((file) => {
      formData.append("images", file);
    });

    // 2. Lấy token (nếu có)
    const token = localStorage.getItem("token");

    // 3. Gửi request bằng axios (axios tự set đúng Content-Type multipart/form-data)
    const response = await axios.post(
      "http://localhost:5000/api/rooms",
      formData,
      {
        headers: {
          // Chỉ set Authorization, không set Content-Type thủ công
          ...(token && { Authorization: `Bearer ${token}` }),
          // **KHÔNG** set "Content-Type": 'multipart/form-data' ở đây
          // axios sẽ tự thêm `Content-Type` cùng boundary
        },
      }
    );

    return response.data.data.room; // server trả về { data: { room: { ... } } }
  };

  const {
    mutate: createRoomMutation,
    isLoading,
    isError,
    error,
    isSuccess,
    data: newRoom,
  } = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      // invalidate cache "rooms" nếu có
      queryClient.invalidateQueries(["rooms"]);
    },
  });

  return {
    createRoomMutation,
    isLoading,
    isError,
    error,
    isSuccess,
    newRoom,
  };
}
