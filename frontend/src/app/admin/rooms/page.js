// src/app/admin/rooms/page.js
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Building,
  Users,
  Ruler,
  DollarSign,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  X,
  Calendar,
  CheckCircle,
  AlertCircle,
  Settings,
  Star,
  Wifi,
  Car,
  Coffee,
  Bath,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  MoreVertical,
  Save,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from "lucide-react";
import { useGetRoomsList } from "../../../components/hooks/room/useGetRoomsList";
import { useCreateRoom } from "../../../components/hooks/room/useCreateRoomNew";
import { useDeleteRoom } from "../../../components/hooks/room/useDeleteRoom";
import { useEditRoom, useToggleRoomAvailability } from "../../../components/hooks/room/useUpdateRoom";
import { MainLayout } from "../../../components/layout/MainLayout";

export default function AdminRoomsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Create room form state
  const [roomForm, setRoomForm] = useState({
    name: "",
    description: "",
    room_type: "",
    capacity: 1,
    price_per_day: "",
    size_sqm: "",
    amenities: [],
    images: []
  });

  const fileInputRef = useRef(null);

  // Main hooks
  const { 
    rooms, 
    pagination, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useGetRoomsList({
    page: currentPage,
    limit: 12,
    room_type: selectedRoomType,
    min_price: priceRange.min ? parseFloat(priceRange.min) : undefined,
    max_price: priceRange.max ? parseFloat(priceRange.max) : undefined,
    available_only: availableOnly
  });

  const { 
    createRoomMutation, 
    isLoading: isCreating, 
    isSuccess: createSuccess,
    error: createError
  } = useCreateRoom();

  // Delete hook - simplified
  const { 
    deleteRoomMutation,
    isDeleting,
    isSuccess: deleteSuccess,
    error: deleteError
  } = useDeleteRoom();

  // Edit hooks
  const {
    editRoomMutation,
    isEditing,
    isSuccess: editSuccess,
    error: editError
  } = useEditRoom({
    onSuccess: () => {
      setShowCreateModal(false);
      setEditingRoom(null);
      refetch();
    }
  });

  const {
    toggleAvailability,
    isLoading: isToggling
  } = useToggleRoomAvailability({
    onSuccess: () => {
      refetch();
    }
  });

  const roomTypes = [
    { value: "standard", label: "Standard", icon: Building, color: "bg-blue-100 text-blue-800" },
    { value: "deluxe", label: "Deluxe", icon: Star, color: "bg-purple-100 text-purple-800" },
    { value: "suite", label: "Suite", icon: Star, color: "bg-pink-100 text-pink-800" },
    { value: "family", label: "Family", icon: Users, color: "bg-green-100 text-green-800" }
  ];

  const availableAmenities = [
    "Wi-Fi", "Air Conditioning", "Heating", "Private Bath", "Balcony",
    "Room Service", "Mini Bar", "Safe", "TV", "Telephone", 
    "Refrigerator", "Microwave", "Coffee Maker", "Hair Dryer", "Iron"
  ];

  const amenityIcons = {
    'Wi-Fi': Wifi,
    'Parking': Car,
    'Breakfast': Coffee,
    'Private Bath': Bath,
    'Air Conditioning': Building,
    'Heating': Building,
    'Mini Bar': Coffee,
    'Balcony': Building,
    'Room Service': Coffee,
    'Safe': Building
  };

  const getRoomTypeInfo = (type) => {
    return roomTypes.find(rt => rt.value === type) || 
           { label: type, icon: Building, color: "bg-gray-100 text-gray-800" };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Create a simple placeholder for failed images (safe for Unicode)
  const createImagePlaceholder = (roomName) => {
    const safeName = roomName ? roomName.replace(/[^\x00-\x7F]/g, "Room") : "Room";
    
    const svgString = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#6b7280" text-anchor="middle" dy=".3em">
          ${safeName}
        </text>
        <rect x="175" y="125" width="50" height="50" fill="#9ca3af" rx="5"/>
      </svg>
    `;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  };

  const handleCreateRoom = () => {
    setRoomForm({
      name: "",
      description: "",
      room_type: "",
      capacity: 1,
      price_per_day: "",
      size_sqm: "",
      amenities: [],
      images: []
    });
    setEditingRoom(null);
    setShowCreateModal(true);
  };

  const handleEditRoom = (room) => {
    setRoomForm({
      name: room.name,
      description: room.description || "",
      room_type: room.room_type,
      capacity: room.capacity,
      price_per_day: room.price_per_day.toString(),
      size_sqm: room.size_sqm?.toString() || "",
      amenities: Array.isArray(room.amenities) ? room.amenities : 
                 (typeof room.amenities === 'string' ? JSON.parse(room.amenities) : []),
      images: []
    });
    setEditingRoom(room);
    setShowCreateModal(true);
  };

  // Simple delete handler with confirmation
  const handleDeleteRoom = (room) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${room.name}"?\n\nThis action cannot be undone.`
    );
    
    if (confirmed) {
      deleteRoomMutation(room.id, {
        onSuccess: () => {
          refetch();
        }
      });
    }
  };

  const handleToggleAvailability = (room) => {
    if (window.confirm(`Are you sure you want to ${room.is_available ? 'disable' : 'enable'} "${room.name}"?`)) {
      toggleAvailability(room.id, room.is_available);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    const roomData = {
      ...roomForm,
      capacity: parseInt(roomForm.capacity),
      price_per_day: parseFloat(roomForm.price_per_day),
      size_sqm: roomForm.size_sqm ? parseFloat(roomForm.size_sqm) : null
    };

    if (editingRoom) {
      editRoomMutation({
        roomId: editingRoom.id,
        roomData
      });
    } else {
      createRoomMutation(roomData);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setRoomForm(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index) => {
    setRoomForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (amenity) => {
    setRoomForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRoomType("");
    setPriceRange({ min: "", max: "" });
    setAvailableOnly(false);
    setCurrentPage(1);
  };

  // Auto-hide success messages
  useEffect(() => {
    if (createSuccess || editSuccess || deleteSuccess) {
      const timer = setTimeout(() => {
        // Success states will reset automatically via react-query
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [createSuccess, editSuccess, deleteSuccess]);

  // Filter rooms by search term (client-side)
  const filteredRooms = rooms?.filter(room => 
    !searchTerm || 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Room Management</h1>
            <p className="text-gray-600">
              Manage hotel rooms, pricing, and availability
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex space-x-3">
            <button
              onClick={() => refetch()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleCreateRoom}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Room
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{pagination.total_records || 0}</p>
                <p className="text-sm text-gray-600">Total Rooms</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {rooms?.filter(r => r.is_available).length || 0}
                </p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {rooms?.filter(r => !r.is_available).length || 0}
                </p>
                <p className="text-sm text-gray-600">Unavailable</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {rooms?.length > 0 ? 
                    formatCurrency(rooms.reduce((sum, r) => sum + r.price_per_day, 0) / rooms.length) : 
                    '$0'
                  }
                </p>
                <p className="text-sm text-gray-600">Avg. Price</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type
                  </label>
                  <select
                    value={selectedRoomType}
                    onChange={(e) => setSelectedRoomType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    {roomTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price/Day
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="$0.00"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price/Day
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="$999.99"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={(e) => setAvailableOnly(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available only</span>
                  </label>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-6 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-4"></div>
                <div className="bg-gray-200 h-8 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Rooms</h3>
            <p className="text-gray-600 mb-4">{error?.message || "Something went wrong"}</p>
            <button 
              onClick={() => refetch()}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Rooms Grid/List */}
        {!isLoading && !isError && filteredRooms.length > 0 && (
          <div className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-6"}>
            {filteredRooms.map((room) => {
              const typeInfo = getRoomTypeInfo(room.room_type);
              const TypeIcon = typeInfo.icon;
              const primaryImage = room.images?.[0];
              
              return (
                <div 
                  key={room.id} 
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  {/* Room Image */}
                  <div className={`relative ${viewMode === "list" ? "w-1/3" : "w-full"}`}>
                    <div className={`relative overflow-hidden rounded-t-2xl ${
                      viewMode === "list" ? "h-full rounded-l-2xl rounded-t-none" : "h-48"
                    }`}>
                      <Image
                        src={primaryImage ? 
                          (primaryImage.startsWith('http') ? primaryImage : `http://localhost:5000${primaryImage}`) : 
                          createImagePlaceholder(room.name)
                        }
                        alt={room.name}
                        fill
                        className="object-cover"
                        unoptimized={true}
                        onError={(e) => {
                          e.target.src = createImagePlaceholder(room.name);
                        }}
                      />
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        room.is_available 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {room.is_available ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    {/* Room Type Badge */}
                    <div className="absolute bottom-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Room Content */}
                  <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                    {/* Room Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`inline-flex p-2 rounded-lg ${typeInfo.color}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      
                      {/* Action Menu */}
                      <div className="relative group">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                          <button
                            onClick={() => handleEditRoom(room)}
                            disabled={isEditing}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Room
                          </button>
                          <button
                            onClick={() => handleToggleAvailability(room)}
                            disabled={isToggling}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {room.is_available ? (
                              <>
                                <ToggleLeft className="h-4 w-4 mr-2" />
                                Disable
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-4 w-4 mr-2" />
                                Enable
                              </>
                            )}
                          </button>
                          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                          <hr className="my-1" />
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            disabled={isDeleting}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Room
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Room Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{room.name}</h3>
                      {room.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{room.description}</p>
                      )}
                    </div>

                    {/* Room Details */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="text-sm">Up to {room.capacity} cats</span>
                      </div>
                      
                      {room.size_sqm && (
                        <div className="flex items-center text-gray-600">
                          <Ruler className="h-4 w-4 mr-2" />
                          <span className="text-sm">{room.size_sqm} m²</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(room.price_per_day)}/day
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">ID: {room.id}</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    {(() => {
                      let amenities = [];
                      try {
                        if (Array.isArray(room.amenities)) {
                          amenities = room.amenities;
                        } else if (typeof room.amenities === 'string') {
                          amenities = JSON.parse(room.amenities);
                        } else if (room.amenities) {
                          amenities = Object.values(room.amenities);
                        }
                      } catch (error) {
                        amenities = [];
                      }

                      return amenities && amenities.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Amenities</h4>
                          <div className="flex flex-wrap gap-2">
                            {amenities.slice(0, 4).map((amenity, index) => {
                              const IconComponent = amenityIcons[amenity] || CheckCircle;
                              return (
                                <div key={index} className="flex items-center bg-gray-50 rounded-lg px-3 py-1">
                                  <IconComponent className="h-3 w-3 text-gray-600 mr-1" />
                                  <span className="text-xs text-gray-700">{amenity}</span>
                                </div>
                              );
                            })}
                            {amenities.length > 4 && (
                              <span className="text-xs text-gray-500 px-3 py-1">
                                +{amenities.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quick Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditRoom(room)}
                        disabled={isEditing}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center text-sm disabled:opacity-50"
                      >
                        {isEditing ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Editing...
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room)}
                        disabled={isDeleting}
                        className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg font-medium hover:bg-red-600 transition-all duration-200 flex items-center justify-center text-sm disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Building className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || selectedRoomType || priceRange.min || priceRange.max
                ? "Try adjusting your search filters to find rooms."
                : "No rooms have been created yet. Create your first room to get started."}
            </p>
            <button
              onClick={handleCreateRoom}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center mx-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create First Room
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-12 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={isLoading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
                        currentPage === page
                          ? "bg-blue-500 text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
                disabled={currentPage === pagination.total_pages || isLoading}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            
            <p className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, pagination.total_records)} of {pagination.total_records} results
            </p>
          </div>
        )}

        {/* Create/Edit Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingRoom ? 'Edit Room' : 'Create New Room'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingRoom(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Room Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={roomForm.name}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter room name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Room Type *
                      </label>
                      <select
                        required
                        value={roomForm.room_type}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, room_type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select room type</option>
                        {roomTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Capacity *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="10"
                          value={roomForm.capacity}
                          onChange={(e) => setRoomForm(prev => ({ ...prev, capacity: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Size (m²)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={roomForm.size_sqm}
                          onChange={(e) => setRoomForm(prev => ({ ...prev, size_sqm: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price per Day ($) *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        value={roomForm.price_per_day}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, price_per_day: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        rows="4"
                        value={roomForm.description}
                        onChange={(e) => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter room description"
                      />
                    </div>
                  </div>

                  {/* Amenities & Images */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Amenities & Images</h3>
                    
                    {/* Amenities */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Amenities
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {availableAmenities.map((amenity) => (
                          <label key={amenity} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={roomForm.amenities.includes(amenity)}
                              onChange={() => toggleAmenity(amenity)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm text-gray-700">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Room Images
                      </label>
                      
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                      >
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 mb-2">
                          Click to upload images or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB each
                        </p>
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      {/* Image Preview */}
                      {roomForm.images.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Selected Images ({roomForm.images.length})
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {roomForm.images.map((file, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {(createError || editError) && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-sm text-red-700">
                        {(createError || editError)?.response?.data?.message || 
                         `An error occurred while ${editingRoom ? 'updating' : 'creating'} the room`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="mt-8 flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingRoom(null);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isEditing}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {(isCreating || isEditing) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingRoom ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingRoom ? 'Update Room' : 'Create Room'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Messages */}
        {createSuccess && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
            <CheckCircle className="h-5 w-5 mr-2" />
            Room created successfully!
          </div>
        )}

        {editSuccess && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
            <CheckCircle className="h-5 w-5 mr-2" />
            Room updated successfully!
          </div>
        )}

        {deleteSuccess && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
            <CheckCircle className="h-5 w-5 mr-2" />
            Room deleted successfully!
          </div>
        )}

        {/* Error Messages */}
        {deleteError && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Failed to delete room: {deleteError?.response?.data?.message || deleteError?.message}
          </div>
        )}
      </div>
    </MainLayout>
  );
}