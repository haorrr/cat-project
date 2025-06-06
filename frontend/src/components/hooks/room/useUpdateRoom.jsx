"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

/**
 * Hook để chỉnh sửa phòng
 * 
 * roomData: {
 *   name?: string,
 *   description?: string,
 *   room_type?: string,
 *   capacity?: number,
 *   price_per_day?: number,
 *   amenities?: string[],
 *   size_sqm?: number,
 *   is_available?: boolean,
 *   images?: File[],              // Ảnh mới cần upload
 *   remove_images?: number[]      // IDs của ảnh cần xóa
 * }
 * 
 * @param {Object} options - Các tùy chọn cho mutation
 */
export function useEditRoom(options = {}) {
  const queryClient = useQueryClient();

  const editRoom = async ({ roomId, roomData }) => {
    // 1. Kiểm tra tham số
    if (!roomId) {
      throw new Error("Room ID is required");
    }

    if (!roomData || Object.keys(roomData).length === 0) {
      throw new Error("Room data is required");
    }

    // 2. Lấy token (required cho admin action)
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    // 3. Tạo FormData (vì có thể có file upload)
    const formData = new FormData();

    // Append text fields chỉ khi có giá trị
    if (roomData.name !== undefined) formData.append("name", roomData.name);
    if (roomData.description !== undefined) formData.append("description", roomData.description);
    if (roomData.room_type !== undefined) formData.append("room_type", roomData.room_type);
    if (roomData.capacity !== undefined) formData.append("capacity", roomData.capacity.toString());
    if (roomData.price_per_day !== undefined) formData.append("price_per_day", roomData.price_per_day.toString());
    if (roomData.size_sqm !== undefined) formData.append("size_sqm", roomData.size_sqm.toString());
    if (roomData.is_available !== undefined) formData.append("is_available", roomData.is_available.toString());

    // Amenities - chuyển mảng thành JSON string
    if (roomData.amenities !== undefined) {
      formData.append("amenities", JSON.stringify(roomData.amenities));
    }

    // Remove images - danh sách ID ảnh cần xóa
    if (roomData.remove_images && roomData.remove_images.length > 0) {
      formData.append("remove_images", JSON.stringify(roomData.remove_images));
    }

    // New images - ảnh mới cần upload
    if (roomData.images && roomData.images.length > 0) {
      roomData.images.forEach((file) => {
        formData.append("images", file);
      });
    }

    // 4. Gửi PUT request
    const response = await axios.put(
      `http://localhost:5000/api/rooms/${roomId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // Không set Content-Type, để axios tự động set multipart/form-data
        },
      }
    );

    return response.data.data.room; // server trả về { data: { room: {...} } }
  };

  const {
    mutate: editRoomMutation,
    mutateAsync: editRoomAsync,
    isLoading,
    isError,
    error,
    isSuccess,
    data: updatedRoom,
    reset,
  } = useMutation({
    mutationFn: editRoom,
    onSuccess: (updatedRoom, { roomId }) => {
      // Update specific room in cache
      queryClient.setQueryData(["room", roomId], updatedRoom);
      
      // Invalidate rooms list để refetch
      queryClient.invalidateQueries(["rooms"]);
      
      // Custom onSuccess callback
      if (options.onSuccess) {
        options.onSuccess(updatedRoom, roomId);
      }
    },
    onError: (error, { roomId }) => {
      console.error("Edit room error:", error);
      
      // Custom onError callback
      if (options.onError) {
        options.onError(error, roomId);
      }
    },
  });

  return {
    // Main mutation function
    editRoomMutation,
    editRoomAsync, // Promise-based version
    
    // States
    isLoading,
    isEditing: isLoading, // Alias for better readability
    isError,
    error,
    isSuccess,
    updatedRoom,
    
    // Actions
    reset, // Reset mutation state
  };
}

/**
 * Hook để toggle trạng thái available/unavailable của phòng
 */
export function useToggleRoomAvailability(options = {}) {
  const { editRoomMutation, ...editHook } = useEditRoom(options);

  const toggleAvailability = (roomId, currentStatus) => {
    editRoomMutation({
      roomId,
      roomData: {
        is_available: !currentStatus
      }
    });
  };

  return {
    ...editHook,
    toggleAvailability,
  };
}

/**
 * Hook để chỉ cập nhật giá phòng
 */
export function useUpdateRoomPrice(options = {}) {
  const { editRoomMutation, ...editHook } = useEditRoom(options);

  const updatePrice = (roomId, newPrice) => {
    if (typeof newPrice !== 'number' || newPrice < 0) {
      throw new Error("Invalid price value");
    }

    editRoomMutation({
      roomId,
      roomData: {
        price_per_day: newPrice
      }
    });
  };

  return {
    ...editHook,
    updatePrice,
  };
}

/**
 * Hook để set ảnh primary cho phòng
 */
export function useSetPrimaryImage(options = {}) {
  const queryClient = useQueryClient();

  const setPrimaryImage = async ({ roomId, imageId }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.post(
      `http://localhost:5000/api/rooms/${roomId}/images/set-primary`,
      { imageId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  };

  const {
    mutate: setPrimaryImageMutation,
    mutateAsync: setPrimaryImageAsync,
    isLoading,
    isError,
    error,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: setPrimaryImage,
    onSuccess: (data, { roomId }) => {
      // Invalidate room data để refetch images
      queryClient.invalidateQueries(["room", roomId]);
      queryClient.invalidateQueries(["rooms"]);
      
      if (options.onSuccess) {
        options.onSuccess(data, roomId);
      }
    },
    onError: (error, { roomId }) => {
      console.error("Set primary image error:", error);
      
      if (options.onError) {
        options.onError(error, roomId);
      }
    },
  });

  return {
    setPrimaryImageMutation,
    setPrimaryImageAsync,
    isLoading,
    isSettingPrimary: isLoading,
    isError,
    error,
    isSuccess,
    reset,
  };
}

/**
 * Hook để xóa ảnh cụ thể của phòng
 */
export function useDeleteRoomImage(options = {}) {
  const queryClient = useQueryClient();

  const deleteImage = async ({ roomId, imageId }) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.delete(
      `http://localhost:5000/api/rooms/${roomId}/images/${imageId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  };

  const {
    mutate: deleteImageMutation,
    mutateAsync: deleteImageAsync,
    isLoading,
    isError,
    error,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: deleteImage,
    onSuccess: (data, { roomId }) => {
      // Invalidate room data để refetch images
      queryClient.invalidateQueries(["room", roomId]);
      queryClient.invalidateQueries(["rooms"]);
      
      if (options.onSuccess) {
        options.onSuccess(data, roomId);
      }
    },
    onError: (error, { roomId, imageId }) => {
      console.error("Delete image error:", error);
      
      if (options.onError) {
        options.onError(error, roomId, imageId);
      }
    },
  });

  return {
    deleteImageMutation,
    deleteImageAsync,
    isLoading,
    isDeletingImage: isLoading,
    isError,
    error,
    isSuccess,
    reset,
  };
}

/**
 * Hook tổng hợp cho room management
 */
export function useRoomManagement() {
  const editRoom = useEditRoom();
  const deleteRoom = useDeleteRoom();
  const toggleAvailability = useToggleRoomAvailability();
  const updatePrice = useUpdateRoomPrice();
  const setPrimaryImage = useSetPrimaryImage();
  const deleteImage = useDeleteRoomImage();

  return {
    // Edit operations
    editRoom: editRoom.editRoomMutation,
    isEditing: editRoom.isEditing,
    editError: editRoom.error,
    
    // Delete operations
    deleteRoom: deleteRoom.deleteRoomMutation,
    isDeleting: deleteRoom.isDeleting,
    deleteError: deleteRoom.error,
    
    // Quick actions
    toggleAvailability: toggleAvailability.toggleAvailability,
    updatePrice: updatePrice.updatePrice,
    
    // Image management
    setPrimaryImage: setPrimaryImage.setPrimaryImageMutation,
    deleteImage: deleteImage.deleteImageMutation,
    
    // Combined loading state
    isLoading: editRoom.isLoading || deleteRoom.isLoading || 
               setPrimaryImage.isLoading || deleteImage.isLoading,
  };
}