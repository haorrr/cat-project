"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/**
 * Hook để lấy danh sách phòng với các tùy chọn filter và pagination
 * 
 * @param {Object} options - Các tùy chọn query
 * @param {number} options.page - Trang hiện tại (default: 1)
 * @param {number} options.limit - Số lượng phòng per page (default: 12)
 * @param {string} options.room_type - Loại phòng để filter
 * @param {number} options.min_price - Giá tối thiểu
 * @param {number} options.max_price - Giá tối đa
 * @param {string} options.check_in - Ngày check-in (YYYY-MM-DD)
 * @param {string} options.check_out - Ngày check-out (YYYY-MM-DD)
 * @param {boolean} options.available_only - Chỉ lấy phòng available
 * @param {boolean} options.enabled - Enable/disable query (default: true)
 */
export function useGetRoomsList(options = {}) {
  const {
    page = 1,
    limit = 12,
    room_type,
    min_price,
    max_price,
    check_in,
    check_out,
    available_only,
    enabled = true,
  } = options;

  const fetchRooms = async () => {
    // 1. Tạo query parameters
    const params = new URLSearchParams();
    
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    
    if (room_type) params.append("room_type", room_type);
    if (min_price !== undefined) params.append("min_price", min_price.toString());
    if (max_price !== undefined) params.append("max_price", max_price.toString());
    if (check_in) params.append("check_in", check_in);
    if (check_out) params.append("check_out", check_out);
    if (available_only !== undefined) params.append("available_only", available_only.toString());

    // 2. Lấy token (nếu có) - API này là public nhưng có thể cần auth cho một số tính năng
    const token = localStorage.getItem("token");

    // 3. Gửi request
    const response = await axios.get(
      `http://localhost:5000/api/rooms?${params.toString()}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    return response.data.data; // { rooms: [...], pagination: {...} }
  };

  const {
    data,
    isLoading,
    isError,
    error,
    isSuccess,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "rooms",
      {
        page,
        limit,
        room_type,
        min_price,
        max_price,
        check_in,
        check_out,
        available_only,
      },
    ],
    queryFn: fetchRooms,
    enabled,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
    cacheTime: 1000 * 60 * 10, // Keep in cache 10 phút
  });

  return {
    // Data
    rooms: data?.rooms || [],
    pagination: data?.pagination || {},
    
    // States
    isLoading,
    isError,
    error,
    isSuccess,
    isFetching,
    
    // Actions
    refetch,
  };
}

/**
 * Hook đơn giản hóa để lấy tất cả phòng available
 */
export function useGetAvailableRooms(dateRange = {}) {
  const { check_in, check_out } = dateRange;
  
  return useGetRoomList({
    available_only: true,
    check_in,
    check_out,
    limit: 100, // Lấy nhiều hơn để hiển thị tất cả phòng available
  });
}

/**
 * Hook để search phòng theo loại
 */
export function useGetRoomsByType(roomType, options = {}) {
  return useGetRoomList({
    room_type: roomType,
    ...options,
  });
}

/**
 * Hook để search phòng theo khoảng giá
 */
export function useGetRoomsByPriceRange(minPrice, maxPrice, options = {}) {
  return useGetRoomList({
    min_price: minPrice,
    max_price: maxPrice,
    ...options,
  });
}