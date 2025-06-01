// src/app/rooms/[id]/page.js
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  MapPin,
  Star,
  Calendar,
  Check,
  Wifi,
  Tv,
  Wind,
  Camera,
  Heart,
  Crown,
  Sparkles,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { useGetRoom } from '@/components/hooks/room/useGetRoom';
import { useCheckAvailability } from '@/components/hooks/room/useCheckAvailability';

const RoomDetailPage = () => {
  const params = useParams();
  const roomId = params.id;
  const [checkDates, setCheckDates] = useState({
    check_in: '',
    check_out: ''
  });

  const { room, isLoading, isError, error } = useGetRoom(roomId);
  const { availability, isLoading: checkingAvailability } = useCheckAvailability(
    roomId, 
    checkDates.check_in, 
    checkDates.check_out
  );

  const amenityIcons = {
    climate_control: Wind,
    toy_box: Heart,
    scratching_post: Star,
    window_view: Camera,
    cat_tv: Tv,
    premium_food: Sparkles,
    climbing_tree: Crown,
    private_balcony: MapPin,
    grooming_service: Star,
    webcam_access: Camera,
    wifi: Wifi
  };

  const amenityLabels = {
    climate_control: "Climate Control",
    toy_box: "Premium Toy Collection",
    scratching_post: "Multiple Scratching Posts",
    window_view: "Scenic Window Views",
    cat_tv: "Cat Entertainment TV",
    premium_food: "Gourmet Food Options",
    climbing_tree: "Multi-level Climbing Tree",
    private_balcony: "Private Outdoor Balcony",
    grooming_service: "Professional Grooming",
    webcam_access: "24/7 Webcam Access",
    wifi: "High-Speed WiFi"
  };

  const getRoomTypeColor = (type) => {
    const colors = {
      standard: "bg-blue-100 text-blue-800",
      deluxe: "bg-green-100 text-green-800",
      premium: "bg-purple-100 text-purple-800",
      vip: "bg-yellow-100 text-yellow-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const handleDateChange = (field, value) => {
    setCheckDates(prev => ({ ...prev, [field]: value }));
  };

  const calculateDays = () => {
    if (checkDates.check_in && checkDates.check_out) {
      const start = new Date(checkDates.check_in);
      const end = new Date(checkDates.check_out);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const totalPrice = calculateDays() * (room?.price_per_day || 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="w-full h-96 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="bg-white rounded-lg p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h2>
          <p className="text-gray-600 mb-6">The room you're looking for doesn't exist.</p>
          <Link href="/rooms">
            <Button className="bg-orange-500 hover:bg-orange-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rooms
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/rooms" className="text-gray-500 hover:text-gray-700">Rooms</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{room.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Room Images */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <img
                src={room.images?.[0]?.url || room.images?.[0] || "/api/placeholder/800/500"}
                alt={room.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {room.images?.slice(1, 4).map((image, index) => (
                <img
                  key={index}
                  src={typeof image === 'string' ? image : image.url || "/api/placeholder/200/150"}
                  alt={`${room.name} ${index + 2}`}
                  className="w-full h-28 lg:h-24 object-cover rounded-lg"
                />
              ))}
              {room.images?.length > 4 && (
                <div className="relative">
                  <img
                    src={room.images[4]?.url || room.images[4] || "/api/placeholder/200/150"}
                    alt="More photos"
                    className="w-full h-28 lg:h-24 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white font-medium">+{room.images.length - 4} photos</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{room.name}</h1>
                <Badge className={getRoomTypeColor(room.room_type)}>
                  {room.room_type?.toUpperCase()}
                </Badge>
                {!room.is_available && (
                  <Badge variant="destructive">Not Available</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-6 text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-5 w-5" />
                  <span>Up to {room.capacity} cats</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  <span>{room.size_sqm}m² space</span>
                </div>
                {room.popularity_score && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Popular choice</span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 text-lg leading-relaxed">{room.description}</p>
            </div>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Room Amenities</CardTitle>
                <CardDescription>Everything your cat needs for a comfortable stay</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {room.amenities?.map((amenity) => {
                    const Icon = amenityIcons[amenity] || Check;
                    const label = amenityLabels[amenity] || amenity.replace('_', ' ').charAt(0).toUpperCase() + amenity.replace('_', ' ').slice(1);
                    return (
                      <div key={amenity} className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Room Policies */}
            <Card>
              <CardHeader>
                <CardTitle>Room Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>Check-in:</strong> 8:00 AM - 8:00 PM
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>Check-out:</strong> 8:00 AM - 12:00 PM
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>Vaccinations:</strong> Required (FVRCP, Rabies)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>Cancellation:</strong> Free cancellation up to 24 hours before check-in
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Card */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      ${room.price_per_day}
                      <span className="text-base font-normal text-gray-500"> /night</span>
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">Popular</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="check_in">Check In</Label>
                    <Input
                      id="check_in"
                      type="date"
                      value={checkDates.check_in}
                      onChange={(e) => handleDateChange('check_in', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="check_out">Check Out</Label>
                    <Input
                      id="check_out"
                      type="date"
                      value={checkDates.check_out}
                      onChange={(e) => handleDateChange('check_out', e.target.value)}
                      min={checkDates.check_in || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Availability Check */}
                {checkDates.check_in && checkDates.check_out && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {checkingAvailability ? (
                      <div className="text-sm text-gray-600">Checking availability...</div>
                    ) : availability ? (
                      availability.available ? (
                        <div className="text-sm text-green-600 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Available for selected dates
                        </div>
                      ) : (
                        <div className="text-sm text-red-600">
                          Not available for selected dates
                        </div>
                      )
                    ) : null}
                  </div>
                )}

                {/* Price Breakdown */}
                {calculateDays() > 0 && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>${room.price_per_day} × {calculateDays()} nights</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Booking Button */}
                <div className="space-y-2">
                  {room.is_available && availability?.available !== false ? (
                    <Link 
                      href={`/booking/new?room_id=${room.id}&check_in=${checkDates.check_in}&check_out=${checkDates.check_out}`}
                      className="block"
                    >
                      <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg">
                        Reserve Now
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full" size="lg">
                      Not Available
                    </Button>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    You won't be charged yet
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Questions?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  Our team is here to help with any questions about this room or booking process.
                </p>
                <Link href="/contact">
                  <Button variant="outline" className="w-full">
                    Contact Us
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;