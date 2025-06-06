// src/app/dashboard/rooms/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  Users,
  Ruler,
  DollarSign,
  Search,
  Filter,
  Calendar,
  Heart,
  Wifi,
  Car,
  Coffee,
  Bath,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Grid,
  List
} from "lucide-react";
import { useGetRoomsList } from "../../../components/hooks/room/useGetRoomsList";
import { MainLayout } from "../../../components/layout/MainLayout";

export default function RoomsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

  const { 
    rooms, 
    pagination, 
    isLoading, 
    isError, 
    error 
  } = useGetRoomsList({
    page: currentPage,
    limit: 12,
    room_type: selectedRoomType,
    min_price: priceRange.min ? parseFloat(priceRange.min) : undefined,
    max_price: priceRange.max ? parseFloat(priceRange.max) : undefined,
    check_in: checkIn,
    check_out: checkOut,
    available_only: availableOnly
  });

  const roomTypes = [
    {
      value: "standard",
      label: "Standard",
      icon: Building,
      color: "bg-blue-100 text-blue-800",
      description: "Comfortable basic accommodation"
    },
    {
      value: "deluxe",
      label: "Deluxe",
      icon: Star,
      color: "bg-purple-100 text-purple-800",
      description: "Premium rooms with extra amenities"
    },
    {
      value: "suite",
      label: "Suite",
      icon: Heart,
      color: "bg-pink-100 text-pink-800",
      description: "Spacious luxury accommodation"
    },
    {
      value: "family",
      label: "Family",
      icon: Users,
      color: "bg-green-100 text-green-800",
      description: "Perfect for multiple cats"
    }
  ];

  const amenityIcons = {
    'Wi-Fi': Wifi,
    'Parking': Car,
    'Breakfast': Coffee,
    'Private Bath': Bath,
    'Air Conditioning': Building,
    'Heating': Building,
    'Mini Bar': Coffee,
    'Balcony': MapPin,
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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRoomType("");
    setPriceRange({ min: "", max: "" });
    setCheckIn("");
    setCheckOut("");
    setAvailableOnly(false);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigation handlers
  const handleBookNow = (roomId) => {
    router.push('/dashboard/bookings');
  };

  const handleViewDetails = (roomId) => {
    router.push(`/rooms/${roomId}`);
  };

  // Filter rooms by search term (client-side for name search)
  const filteredRooms = rooms?.filter(room => 
    !searchTerm || 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isError) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Building className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Rooms</h3>
            <p className="text-gray-600 mb-4">{error?.message || "Something went wrong"}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Luxury Cat Rooms</h1>
            <p className="text-gray-600">
              Comfortable and secure accommodations for your beloved cats
            </p>
          </div>
          <div className="mt-4 lg:mt-0 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Room Features</p>
                <p className="text-xs text-blue-700">Climate controlled with 24/7 monitoring</p>
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
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check In
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check Out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Available rooms only</span>
                </label>

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

        {/* Room Types Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {roomTypes.map((type) => {
            const typeRooms = rooms?.filter(r => r.room_type === type.value) || [];
            const Icon = type.icon;
            
            return (
              <button
                key={type.value}
                onClick={() => setSelectedRoomType(selectedRoomType === type.value ? "" : type.value)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedRoomType === type.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className={`inline-flex p-3 rounded-xl ${type.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{type.label}</h3>
                <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                <p className="text-xs text-gray-500">{typeRooms.length} rooms available</p>
              </button>
            );
          })}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">
              {pagination.total_records} rooms found
              {selectedRoomType && ` in ${getRoomTypeInfo(selectedRoomType).label}`}
            </p>
            {isLoading && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Page {pagination.current_page} of {pagination.total_pages}
          </div>
        </div>

        {/* Rooms Grid/List */}
        {isLoading && currentPage === 1 ? (
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
        ) : filteredRooms.length > 0 ? (
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
                    {primaryImage ? (
                      <img
                        src={primaryImage.startsWith('http') ? primaryImage : `http://localhost:5000${primaryImage}`}
                        alt={room.name}
                        className={`w-full object-cover rounded-t-2xl ${
                          viewMode === "list" ? "h-full rounded-l-2xl rounded-t-none" : "h-48"
                        }`}
                        onError={(e) => {
                          console.log('Image load error:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback placeholder - always render */}
                    <div 
                      className={`bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center rounded-t-2xl ${
                        viewMode === "list" ? "h-full rounded-l-2xl rounded-t-none" : "h-48"
                      } ${primaryImage ? 'hidden' : ''}`}
                      style={{ display: primaryImage ? 'none' : 'flex' }}
                    >
                      <Building className="h-12 w-12 text-gray-400" />
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
                    <div className="absolute top-4 left-4">
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
                      {room.image_count > 0 && (
                        <span className="text-xs text-gray-500">
                          {room.image_count} photo{room.image_count !== 1 ? 's' : ''}
                        </span>
                      )}
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
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm">24/7 Care</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    {(() => {
                      // Safely parse amenities
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
                        console.warn('Error parsing amenities:', error);
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

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={() => handleBookNow(room.id)}
                        disabled={!room.is_available}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        Book Now
                      </button>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewDetails(room.id)}
                          className="flex-1 text-blue-600 hover:text-blue-700 text-sm font-medium py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Building className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || selectedRoomType || priceRange.min || priceRange.max || checkIn || checkOut
                ? "Try adjusting your search filters to find available rooms."
                : "No rooms are currently available. Please check back later."}
            </p>
            {(searchTerm || selectedRoomType || priceRange.min || priceRange.max || checkIn || checkOut) && (
              <button
                onClick={clearFilters}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-12 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
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
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.total_pages}
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

        {/* Room Features Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose Our Rooms?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Building className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Premium Comfort</h3>
              <p className="text-gray-600 text-sm">
                Climate-controlled rooms with premium bedding and play areas
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">24/7 Care</h3>
              <p className="text-gray-600 text-sm">
                Round-the-clock monitoring and care from trained professionals
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Safety First</h3>
              <p className="text-gray-600 text-sm">
                Secure facilities with advanced safety measures and emergency protocols
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}