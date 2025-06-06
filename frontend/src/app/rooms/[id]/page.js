// src/app/rooms/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building,
  Users,
  Ruler,
  DollarSign,
  Star,
  Wifi,
  Car,
  Coffee,
  Bath,
  ArrowLeft,
  Heart,
  Share2,
  Calendar,
  CheckCircle,
  Info,
  MapPin,
  Clock,
  Shield,
  Award,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2
} from "lucide-react";
import axios from "axios";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);

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

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`http://localhost:5000/api/rooms/${params.id}`);
        setRoom(response.data.data.room);
      } catch (err) {
        setIsError(true);
        setError(err.response?.data?.message || "Failed to load room details");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchRoom();
    }
  }, [params.id]);

  // Check availability
  const checkAvailability = async () => {
    if (!checkIn || !checkOut) {
      alert("Please select both check-in and check-out dates");
      return;
    }

    try {
      setIsCheckingAvailability(true);
      const response = await axios.get(
        `http://localhost:5000/api/rooms/${params.id}/availability?start_date=${checkIn}&end_date=${checkOut}`
      );
      setAvailabilityResult(response.data.data);
    } catch (err) {
      console.error("Availability check error:", err);
      setAvailabilityResult({
        available: false,
        reason: "Error checking availability"
      });
    } finally {
      setIsCheckingAvailability(false);
    }
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

  // Safe image URL getter
  const getSafeImageUrl = (imageData) => {
    try {
      if (!imageData) return null;
      
      // If imageData is a string URL
      if (typeof imageData === 'string') {
        return imageData.startsWith('http') ? imageData : `http://localhost:5000${imageData}`;
      }
      
      // If imageData is an object with url property
      if (typeof imageData === 'object' && imageData.url) {
        return imageData.url.startsWith('http') ? imageData.url : `http://localhost:5000${imageData.url}`;
      }
      
      // If imageData is an object with image_url property
      if (typeof imageData === 'object' && imageData.image_url) {
        return imageData.image_url.startsWith('http') ? imageData.image_url : `http://localhost:5000${imageData.image_url}`;
      }
      
      return null;
    } catch (error) {
      console.error('Image URL error:', error);
      return null;
    }
  };

  const nextImage = () => {
    if (room?.images && room.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % room.images.length);
    }
  };

  const prevImage = () => {
    if (room?.images && room.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + room.images.length) % room.images.length);
    }
  };

  const getRoomTypeInfo = (type) => {
    const types = {
      'standard': { label: 'Standard', color: 'bg-blue-100 text-blue-800' },
      'deluxe': { label: 'Deluxe', color: 'bg-purple-100 text-purple-800' },
      'suite': { label: 'Suite', color: 'bg-pink-100 text-pink-800' },
      'family': { label: 'Family', color: 'bg-green-100 text-green-800' }
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="dashboard/rooms" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Rooms
              </Link>
              <Link href="/" className="flex items-center">
                <div className="bg-gradient-to-r from-orange-400 to-pink-400 p-2 rounded-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Cat Hotel</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-96 rounded-2xl mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-gray-200 h-8 rounded w-1/2 mb-4"></div>
                <div className="bg-gray-200 h-4 rounded w-full mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-8"></div>
              </div>
              <div>
                <div className="bg-gray-200 h-64 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/rooms" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Rooms
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Building className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            href="/rooms"
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Browse All Rooms
          </Link>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const typeInfo = getRoomTypeInfo(room.room_type);
  const images = room.images || [];
  const currentImageData = images[currentImageIndex];
  const currentImageUrl = getSafeImageUrl(currentImageData);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/rooms" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Rooms
            </Link>
            <Link href="/" className="flex items-center">
              <div className="bg-gradient-to-r from-orange-400 to-pink-400 p-2 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Cat Hotel</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
              <button className="text-gray-600 hover:text-red-500 transition-colors">
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Gallery */}
        <div className="mb-8">
          {images.length > 0 ? (
            <div className="relative">
              <div className="relative h-96 rounded-2xl overflow-hidden">
                <Image
                  src={currentImageUrl || createImagePlaceholder(room.name)}
                  alt={room.name}
                  fill
                  className="object-cover"
                  unoptimized={true}
                  onError={(e) => {
                    e.target.src = createImagePlaceholder(room.name);
                  }}
                />
                
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-800" />
                    </button>
                  </>
                )}

                {/* Expand Button */}
                <button
                  onClick={() => setShowImageModal(true)}
                  className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                >
                  <Maximize2 className="h-5 w-5 text-gray-800" />
                </button>

                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                  {images.map((image, index) => {
                    const thumbnailUrl = getSafeImageUrl(image);
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex ? 'border-orange-500' : 'border-gray-200'
                        }`}
                      >
                        <Image
                          src={thumbnailUrl || createImagePlaceholder(room.name)}
                          alt={`${room.name} ${index + 1}`}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                          unoptimized={true}
                          onError={(e) => {
                            e.target.src = createImagePlaceholder(room.name);
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 rounded-2xl overflow-hidden">
              <Image
                src={createImagePlaceholder(room.name)}
                alt={room.name}
                fill
                className="object-cover"
                unoptimized={true}
              />
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Room Details */}
          <div className="lg:col-span-2">
            {/* Room Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    room.is_available 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {room.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600 ml-2">(4.9)</span>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">{room.name}</h1>
              
              <div className="flex items-center space-x-6 mb-6 text-gray-600">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  <span>Up to {room.capacity} cats</span>
                </div>
                {room.size_sqm && (
                  <div className="flex items-center">
                    <Ruler className="h-5 w-5 mr-2" />
                    <span>{room.size_sqm} m²</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>24/7 Care</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatCurrency(room.price_per_day)}
                  </span>
                  <span className="text-xl text-gray-600 ml-2">/day</span>
                </div>
              </div>

              {room.description && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Room</h3>
                  <p className="text-gray-600 leading-relaxed">{room.description}</p>
                </div>
              )}
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Room Amenities</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {amenities.map((amenity, index) => {
                    const IconComponent = amenityIcons[amenity] || CheckCircle;
                    return (
                      <div key={index} className="flex items-center">
                        <IconComponent className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Policies */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Policies & Information</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Check-in/Check-out</h4>
                  <p className="text-gray-600">Check-in: 2:00 PM | Check-out: 12:00 PM</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vaccination Requirements</h4>
                  <p className="text-gray-600">All cats must be up to date on vaccinations and provide health records.</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Cancellation Policy</h4>
                  <p className="text-gray-600">Free cancellation up to 24 hours before check-in.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-24">
              <div className="mb-6">
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(room.price_per_day)}
                  </span>
                  <span className="text-gray-600 ml-2">/day</span>
                </div>
                <p className="text-sm text-gray-500">All taxes and fees included</p>
              </div>

              {/* Date Selection */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Availability Check */}
              <button
                onClick={checkAvailability}
                disabled={isCheckingAvailability || !checkIn || !checkOut}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-4"
              >
                {isCheckingAvailability ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                    Checking...
                  </>
                ) : (
                  "Check Availability"
                )}
              </button>

              {/* Availability Result */}
              {availabilityResult && (
                <div className={`p-4 rounded-lg mb-6 ${
                  availabilityResult.available 
                    ? "bg-green-50 border border-green-200" 
                    : "bg-red-50 border border-red-200"
                }`}>
                  <div className="flex items-center">
                    <CheckCircle className={`h-5 w-5 mr-2 ${
                      availabilityResult.available ? "text-green-500" : "text-red-500"
                    }`} />
                    <span className={`font-medium ${
                      availabilityResult.available ? "text-green-800" : "text-red-800"
                    }`}>
                      {availabilityResult.available ? "Available!" : "Not Available"}
                    </span>
                  </div>
                  {availabilityResult.reason && (
                    <p className={`text-sm mt-1 ${
                      availabilityResult.available ? "text-green-700" : "text-red-700"
                    }`}>
                      {availabilityResult.reason}
                    </p>
                  )}
                  {availabilityResult.conflicting_bookings > 0 && (
                    <p className="text-sm text-red-700 mt-1">
                      {availabilityResult.conflicting_bookings} conflicting booking(s) found
                    </p>
                  )}
                </div>
              )}

              {/* Book Now Button */}
              <Link
                href="/auth"
                className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white py-4 px-4 rounded-lg font-semibold hover:from-orange-500 hover:to-pink-500 transition-all duration-200 flex items-center justify-center mb-6"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book This Room
              </Link>

              {/* Contact Info */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Need Help?</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-3" />
                    <span className="text-sm">Call us: (555) 123-4567</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-3" />
                    <span className="text-sm">hello@cathotel.com</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-3" />
                    <span className="text-sm">24/7 Support Available</span>
                  </div>
                </div>
              </div>

              {/* Safety Features */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Safety Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Shield className="h-4 w-4 mr-3 text-green-500" />
                    <span className="text-sm">24/7 Security Monitoring</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CheckCircle className="h-4 w-4 mr-3 text-green-500" />
                    <span className="text-sm">Climate Controlled</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Award className="h-4 w-4 mr-3 text-green-500" />
                    <span className="text-sm">Licensed & Insured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Rooms */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Similar Rooms You Might Like</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* This would be populated with similar rooms data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="bg-gray-100 h-48 rounded-lg mb-4 flex items-center justify-center">
                <Building className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Deluxe Cat Suite</h3>
              <p className="text-gray-600 text-sm mb-4">Spacious luxury accommodation with premium amenities</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">$89/day</span>
                <Link href="/rooms/2" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  View Details
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="bg-gray-100 h-48 rounded-lg mb-4 flex items-center justify-center">
                <Building className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Family Cat Room</h3>
              <p className="text-gray-600 text-sm mb-4">Perfect for multiple cats with extra space and amenities</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">$129/day</span>
                <Link href="/rooms/3" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  View Details
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="bg-gray-100 h-48 rounded-lg mb-4 flex items-center justify-center">
                <Building className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Standard Comfort</h3>
              <p className="text-gray-600 text-sm mb-4">Comfortable basic accommodation with essential amenities</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">$49/day</span>
                <Link href="/rooms/4" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Book Your Cat's Stay?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Give your cat the luxury treatment they deserve with our premium accommodations.
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
              href="/rooms"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
            >
              <Building className="h-5 w-5 mr-2" />
              Browse All Rooms
            </Link>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && currentImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="relative">
              <Image
                src={currentImageUrl}
                alt={room.name}
                width={800}
                height={600}
                className="w-full h-auto rounded-lg"
                unoptimized={true}
                onError={(e) => {
                  e.target.src = createImagePlaceholder(room.name);
                }}
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        </div>
      )}

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
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/rooms" className="hover:text-white transition-colors">All Rooms</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Services</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  (555) 123-4567
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  hello@cathotel.com
                </li>
                <li className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  123 Pet Street, City
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