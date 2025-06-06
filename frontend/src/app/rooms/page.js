// src/app/rooms/page.js
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building,
  Users,
  Ruler,
  DollarSign,
  Search,
  Filter,
  Star,
  Wifi,
  Car,
  Coffee,
  Bath,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Heart,
  Eye,
  Calendar,
  CheckCircle,
  Info,
  ArrowRight,
  MapPin,
  Clock,
  Shield,
  Award
} from "lucide-react";
import { useGetRoomsList } from "../../components/hooks/room/useGetRoomsList";

export default function PublicRoomsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid");

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
      description: "Comfortable basic accommodation for your cats"
    },
    {
      value: "deluxe",
      label: "Deluxe",
      icon: Star,
      color: "bg-purple-100 text-purple-800",
      description: "Premium rooms with extra amenities and space"
    },
    {
      value: "suite",
      label: "Suite",
      icon: Star,
      color: "bg-pink-100 text-pink-800",
      description: "Spacious luxury accommodation with premium care"
    },
    {
      value: "family",
      label: "Family",
      icon: Users,
      color: "bg-green-100 text-green-800",
      description: "Perfect for multiple cats or larger feline families"
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
    'Safe': Shield
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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedRoomType("");
    setPriceRange({ min: "", max: "" });
    setCheckIn("");
    setCheckOut("");
    setAvailableOnly(true);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter rooms by search term (client-side)
  const filteredRooms = rooms?.filter(room => 
    !searchTerm || 
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="bg-gradient-to-r from-orange-400 to-pink-400 p-2 rounded-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Cat Hotel</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth"
                className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-4 py-2 rounded-lg hover:from-orange-500 hover:to-pink-500 transition-all duration-200"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Luxury Rooms for Your Beloved Cats
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover our premium accommodations designed with your cat's comfort and happiness in mind. 
            Each room features modern amenities and 24/7 professional care.
          </p>
          
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-orange-500 mb-2">{pagination.total_records || 0}</div>
              <div className="text-gray-600">Available Rooms</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-green-500 mb-2">24/7</div>
              <div className="text-gray-600">Professional Care</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-500 mb-2">5★</div>
              <div className="text-gray-600">Rated Service</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-purple-500 mb-2">100%</div>
              <div className="text-gray-600">Safety Guaranteed</div>
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
                placeholder="Search rooms by name or features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Quick Date Range */}
            <div className="flex space-x-2">
              <div>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Check-in"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Check-out"
                />
              </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={(e) => setAvailableOnly(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
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
                    ? "border-orange-500 bg-orange-50"
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
              <div className="flex items-center text-orange-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Page {pagination.current_page} of {pagination.total_pages}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && currentPage === 1 && (
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
              <Building className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Rooms</h3>
            <p className="text-gray-600 mb-4">{error?.message || "Something went wrong"}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
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
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 group ${
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
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <div className="absolute bottom-4 right-4">
                      <button className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors">
                        <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
                      </button>
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
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm">24/7 Care</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Shield className="h-4 w-4 mr-2" />
                        <span className="text-sm">Secure</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-gray-900">
                          {formatCurrency(room.price_per_day)}
                        </span>
                        <span className="text-gray-600 ml-1">/day</span>
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
                            {amenities.slice(0, 3).map((amenity, index) => {
                              const IconComponent = amenityIcons[amenity] || CheckCircle;
                              return (
                                <div key={index} className="flex items-center bg-gray-50 rounded-lg px-3 py-1">
                                  <IconComponent className="h-3 w-3 text-gray-600 mr-1" />
                                  <span className="text-xs text-gray-700">{amenity}</span>
                                </div>
                              );
                            })}
                            {amenities.length > 3 && (
                              <span className="text-xs text-gray-500 px-3 py-1">
                                +{amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Link
                        href={`/auth`}
                        className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-500 hover:to-pink-500 transition-all duration-200 flex items-center justify-center"
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        Book Now
                      </Link>
                      
                      <div className="flex space-x-2">
                        <Link
                          href={`/rooms/${room.id}`}
                          className="flex-1 text-orange-600 hover:text-orange-700 text-sm font-medium py-2 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors duration-200 flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Link>
                        <button className="flex-1 text-gray-600 hover:text-gray-700 text-sm font-medium py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center">
                          <Heart className="h-4 w-4 mr-1" />
                          Save
                        </button>
                      </div>
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
            <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Building className="h-12 w-12 text-orange-600" />
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
                          ? "bg-orange-500 text-white"
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

        {/* Why Choose Us Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Our Cat Hotel?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium Safety</h3>
              <p className="text-gray-600">
                State-of-the-art security systems, climate control, and emergency protocols ensure your cat's safety 24/7.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Loving Care</h3>
              <p className="text-gray-600">
                Our certified pet care specialists provide personalized attention and love to each guest.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Luxury Comfort</h3>
              <p className="text-gray-600">
                Premium amenities, spacious accommodations, and enrichment activities for your cat's happiness.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Book Your Cat's Stay?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of happy cat parents who trust us with their beloved pets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-8 py-4 rounded-xl font-semibold hover:from-orange-500 hover:to-pink-500 transition-all duration-200 flex items-center justify-center"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book Now
            </Link>
            <Link
              href="/contact"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
            >
              <Info className="h-5 w-5 mr-2" />
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-orange-400 to-pink-400 p-2 rounded-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">Cat Hotel</span>
              </div>
              <p className="text-gray-400 mb-4">
                Premium accommodations and loving care for your beloved cats. 
                We provide a safe, comfortable, and enjoyable experience for every feline guest.
              </p>
              <div className="flex space-x-4">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Star className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Shield className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/rooms" className="hover:text-white transition-colors">Room Booking</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Pet Care</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Grooming</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Health Check</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  123 Pet Street, City
                </li>
                <li className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  24/7 Service
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Get in Touch
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Cat Hotel. All rights reserved. Made with ❤️ for cats.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}