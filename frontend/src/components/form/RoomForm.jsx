"use client";

import React, { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { toast } from "react-hot-toast";
import { useCreateRoom } from "../hooks/room/useCreateRoomNew";

export default function RoomForm() {
  const {
    createRoomMutation,
    isLoading,
    isError,
    error,
    isSuccess,
    newRoom,
  } = useCreateRoom();

  // State của form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [sizeSqm, setSizeSqm] = useState("");
  const [amenities, setAmenities] = useState([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const fileInputRef = useRef(null);

  // Thêm amenity
  const handleAddAmenity = () => {
    const trimmed = amenityInput.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities((prev) => [...prev, trimmed]);
      setAmenityInput("");
    }
  };

  const handleRemoveAmenity = (item) => {
    setAmenities((prev) => prev.filter((a) => a !== item));
  };

  // Xử lý chọn file (nhiều file)
  const handleImageChange = (e) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files).slice(0, 10); // Giới hạn max 10 ảnh
    setImages(fileArray);

    // Tạo preview base64
    const readers = fileArray.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((urls) => {
      setPreviews(urls);
    });
  };

  const handleClearImages = () => {
    setImages([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Khi submit
  const handleSubmit = (e) => {
    e.preventDefault();

    // Kiểm tra bắt buộc
    if (!name.trim() || !roomType || !capacity || !pricePerDay || !sizeSqm) {
      toast.error(
        "Vui lòng điền đầy đủ: tên, loại phòng, sức chứa, giá, và diện tích."
      );
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      room_type: roomType,
      capacity: Number(capacity),
      price_per_day: Number(pricePerDay),
      size_sqm: Number(sizeSqm),
      amenities,
      images, // mảng File
    };

    // // Gọi mutation (axios sẽ gửi multipart/form-data)
    createRoomMutation(payload);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Tạo phòng mới</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tên phòng */}
        <div>
          <label className="block text-sm font-medium mb-1">Tên phòng</label>
          <Input
            type="text"
            placeholder="VD: Suite Gia đình"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <Textarea
            placeholder="Mô tả chi tiết về phòng..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Loại phòng */}
        <div>
          <label className="block text-sm font-medium mb-1">Loại phòng</label>
          <Select value={roomType} onValueChange={(val) => setRoomType(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại phòng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
    <SelectItem value="deluxe">Deluxe</SelectItem>
    <SelectItem value="premium">Premium</SelectItem>
    <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sức chứa, Giá 1 ngày, Diện tích */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sức chứa</label>
            <Input
              type="number"
              placeholder="VD: 2"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Giá / ngày (VNĐ)
            </label>
            <Input
              type="number"
              placeholder="VD: 1000000"
              value={pricePerDay}
              onChange={(e) => setPricePerDay(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Diện tích (m²)
            </label>
            <Input
              type="number"
              placeholder="VD: 30"
              value={sizeSqm}
              onChange={(e) => setSizeSqm(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Tiện nghi (gõ và nhấn +)
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="VD: Wi-Fi"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddAmenity();
                }
              }}
            />
            <Button type="button" onClick={handleAddAmenity} className="px-4">
              +
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {amenities.map((item) => (
              <div
                key={item}
                className="flex items-center bg-gray-200 px-2 py-1 rounded-full text-sm"
              >
                <span className="mr-1">{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(item)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upload ảnh */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Ảnh phòng (tối đa 10)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          {previews.length > 0 && (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={src}
                    alt={`Preview ${idx + 1}`}
                    className="h-24 w-full object-cover rounded"
                  />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <button
              type="button"
              onClick={handleClearImages}
              className="mt-2 text-red-500 hover:underline text-sm"
            >
              Xóa ảnh đã chọn
            </button>
          )}
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Đang tạo..." : "Tạo phòng mới"}
          </Button>
        </div>

        {/* Thông báo lỗi / thành công */}
        {isError && (
          <p className="mt-2 text-red-600">Error: {error?.message}</p>
        )}
        {isSuccess && newRoom && (
          <p className="mt-2 text-green-600">
            Tạo phòng thành công! ID phòng: {newRoom.id}
          </p>
        )}
      </form>
    </div>
  );
}
