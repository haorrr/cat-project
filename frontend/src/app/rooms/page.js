// src/app/rooms/page.js
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Users,
  DollarSign,
  Star,
  Wind,
  Camera,
  Heart,
  Crown,
  Sparkles,
  Search,
  Filter,
  MapPin
} from 'lucide-react';
import { useGetRooms } from '@/components/hooks/room/useGetRooms';

const RoomsPage = () => {
  const [filters, setFilters] = useState({
    room_type: '',
    min_price: '',
    max_price: '',
    check_in: '',
    check_out: '',
    available_only: true,
    page: 1,
    limit: 12
  });

  const { rooms, pagination, isLoading, isError, error, refetch } = useGetRooms(filters);

  const amenityIcons = {
    climate_control: Wind,
    toy_box: Heart,
    scratching_post: Star,
    window_view: Camera,
    cat_tv: Crown,
    premium_food: Sparkles,
    climbing_tree: Crown,
    private_balcony: MapPin,
    grooming_service: Star,
    webcam_access: Camera
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Luxury Cat Rooms</h1>
            <p className="text-xl text-orange-100">
              Choose the perfect accommodation for your feline friend
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <Label htmlFor="room_type">Room Type</Label>
              <Select 
                value={filters.room_type} 
                onValueChange={(value) => handleFilterChange('room_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deluxe">Deluxe</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-32">
              <Label htmlFor="min_price">Min Price</Label>
              <Input
                id="min_price"
                type="number"
                placeholder="$0"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
              />
            </div>

            <div className="flex-1 min-w-32">
              <Label htmlFor="max_price">Max Price</Label>
              <Input
                id="max_price"
                type="number"
                placeholder="$999"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
              />
            </div>

            <div className="flex-1 min-w-40">
              <Label htmlFor="check_in">Check In</Label>
              <Input
                id="check_in"
                type="date"
                value={filters.check_in}
                onChange={(e) => handleFilterChange('check_in', e.target.value)}
              />
            </div>

            <div className="flex-1 min-w-40">
              <Label htmlFor="check_out">Check Out</Label>
              <Input
                id="check_out"
                type="date"
                value={filters.check_out}
                onChange={(e) => handleFilterChange('check_out', e.target.value)}
              />
            </div>

            <Button onClick={() => refetch()} className="bg-orange-500 hover:bg-orange-600">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            Error: {error?.message}
          </div>
        )}

        {rooms?.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms?.map((room) => (
                <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={room.images?.[0] || "/api/placeholder/400/300"}
                      alt={room.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className={getRoomTypeColor(room.room_type)}>
                        {room.room_type?.toUpperCase()}
                      </Badge>
                    </div>
                    {!room.is_available && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Badge variant="destructive">Not Available</Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{room.name}</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">
                          ${room.price_per_day}
                        </div>
                        <div className="text-sm text-gray-500">per day</div>
                      </div>
                    </CardTitle>
                    <CardDescription>{room.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Up to {room.capacity} cats</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{room.size_sqm}m²</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Amenities:</h4>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities?.slice(0, 4).map((amenity) => {
                          const Icon = amenityIcons[amenity] || Star;
                          return (
                            <div key={amenity} className="flex items-center gap-1 text-xs text-gray-600">
                              <Icon className="h-3 w-3" />
                              <span className="capitalize">{amenity.replace('_', ' ')}</span>
                            </div>
                          );
                        })}
                        {room.amenities?.length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{room.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/rooms/${room.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      {room.is_available && (
                        <Link href={`/booking/new?room_id=${room.id}`} className="flex-1">
                          <Button className="w-full bg-orange-500 hover:bg-orange-600">
                            Book Now
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600">
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;