// src/app/services/page.js
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Heart,
  Scissors,
  Stethoscope,
  Gamepad2,
  GraduationCap,
  Star,
  Clock,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { useGetServices } from '@/components/hooks/service/useGetServices';

const ServicesPage = () => {
  const [filters, setFilters] = useState({
    category: '',
    active_only: true,
    page: 1,
    limit: 20
  });

  const { services, pagination, isLoading, isError, error } = useGetServices(filters);

  const categoryIcons = {
    grooming: Scissors,
    medical: Stethoscope,
    play: Gamepad2,
    training: GraduationCap,
    special: Sparkles
  };

  const categoryColors = {
    grooming: "bg-pink-100 text-pink-800",
    medical: "bg-red-100 text-red-800",
    play: "bg-green-100 text-green-800",
    training: "bg-blue-100 text-blue-800",
    special: "bg-purple-100 text-purple-800"
  };

  const handleCategoryChange = (category) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Premium Cat Services</h1>
            <p className="text-xl text-pink-100">
              From grooming to healthcare, we provide comprehensive care for your feline friends
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Filter by category:</span>
            <Select value={filters.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="grooming">Grooming</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="play">Play & Exercise</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="special">Special Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            Error: {error?.message}
          </div>
        )}

        {services?.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500">Try selecting a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services?.map((service) => {
              const Icon = categoryIcons[service.category] || Star;
              return (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <Badge className={categoryColors[service.category] || "bg-gray-100 text-gray-800"}>
                            {service.category?.charAt(0).toUpperCase() + service.category?.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-pink-600">
                          ${service.price}
                        </div>
                        {service.duration_minutes && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration_minutes}min
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="mb-4">
                      {service.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span>Starting at ${service.price}</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-pink-500 hover:bg-pink-600"
                        onClick={() => window.location.href = `/booking/new?service_id=${service.id}`}
                      >
                        Add to Booking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Featured Services Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Services?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Experienced Staff</h3>
              <p className="text-gray-600">
                Our certified professionals have years of experience caring for cats of all breeds and temperaments.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                We use only the highest quality products and equipment to ensure your cat receives the best care.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalized Care</h3>
              <p className="text-gray-600">
                Every service is tailored to your cat's specific needs, personality, and health requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;