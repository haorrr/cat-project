// src/app/booking/new/page.js
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  PawPrint,
  Hotel,
  CreditCard,
  Check,
  AlertCircle,
  Plus,
  X,
  Star
} from 'lucide-react';
import { useGetCats } from '@/components/hooks/cat/useGetCats';
import { useGetRooms } from '@/components/hooks/room/useGetRooms';
import { useGetServices } from '@/components/hooks/service/useGetServices';
import { useGetFoods } from '@/components/hooks/food/useGetFoods';
import { useBooking } from '@/components/hooks/booking/useBooking';

const NewBookingPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    cat_id: '',
    room_id: searchParams.get('room_id') || '',
    check_in_date: searchParams.get('check_in') || '',
    check_out_date: searchParams.get('check_out') || '',
    services: [],
    foods: [],
    special_requests: ''
  });

  const { cats } = useGetCats({ active_only: true });
  const { rooms } = useGetRooms({ available_only: true });
  const { services } = useGetServices({ active_only: true });
  const { foods } = useGetFoods({ active_only: true });
  const { bookingMutation, isLoading, isError, error, isSuccess, newBooking } = useBooking();

  const calculateDays = () => {
    if (bookingData.check_in_date && bookingData.check_out_date) {
      const start = new Date(bookingData.check_in_date);
      const end = new Date(bookingData.check_out_date);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const calculatePricing = () => {
    const days = calculateDays();
    const selectedRoom = rooms?.find(r => r.id == bookingData.room_id);
    const roomPrice = (selectedRoom?.price_per_day || 0) * days;
    
    const servicesPrice = bookingData.services.reduce((total, service) => {
      const serviceData = services?.find(s => s.id == service.service_id);
      return total + (serviceData?.price || 0) * (service.quantity || 1);
    }, 0);
    
    const foodsPrice = bookingData.foods.reduce((total, food) => {
      const foodData = foods?.find(f => f.id == food.food_id);
      return total + (foodData?.price_per_serving || 0) * (food.quantity || 1);
    }, 0);

    return {
      days,
      roomPrice,
      servicesPrice,
      foodsPrice,
      total: roomPrice + servicesPrice + foodsPrice
    };
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    setBookingData(prev => ({
      ...prev,
      services: [...prev.services, { service_id: '', quantity: 1, service_date: prev.check_in_date, notes: '' }]
    }));
  };

  const updateService = (index, field, value) => {
    setBookingData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  const removeService = (index) => {
    setBookingData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const addFood = () => {
    setBookingData(prev => ({
      ...prev,
      foods: [...prev.foods, { food_id: '', quantity: 1, feeding_date: prev.check_in_date, meal_time: 'breakfast', notes: '' }]
    }));
  };

  const updateFood = (index, field, value) => {
    setBookingData(prev => ({
      ...prev,
      foods: prev.foods.map((food, i) => 
        i === index ? { ...food, [field]: value } : food
      )
    }));
  };

  const removeFood = (index) => {
    setBookingData(prev => ({
      ...prev,
      foods: prev.foods.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!bookingData.cat_id || !bookingData.room_id || !bookingData.check_in_date || !bookingData.check_out_date) {
      alert('Please fill in all required fields');
      return;
    }

    bookingMutation({
      ...bookingData,
      cat_id: Number(bookingData.cat_id),
      room_id: Number(bookingData.room_id)
    });
  };

  useEffect(() => {
    if (isSuccess && newBooking) {
      router.push(`/booking/${newBooking.id}?success=true`);
    }
  }, [isSuccess, newBooking, router]);

  const pricing = calculatePricing();
  const selectedRoom = rooms?.find(r => r.id == bookingData.room_id);
  const selectedCat = cats?.find(c => c.id == bookingData.cat_id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Booking</h1>
          <p className="text-gray-600">Book the perfect stay for your feline friend</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { number: 1, title: 'Basic Info', icon: Calendar },
              { number: 2, title: 'Services & Food', icon: Star },
              { number: 3, title: 'Review & Book', icon: CreditCard }
            ].map((stepItem) => {
              const Icon = stepItem.icon;
              return (
                <div key={stepItem.number} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    step >= stepItem.number ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > stepItem.number ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-sm ${step >= stepItem.number ? 'text-orange-600' : 'text-gray-500'}`}>
                    {stepItem.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Basic Booking Information
                  </CardTitle>
                  <CardDescription>
                    Select your cat, room, and dates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cat Selection */}
                  <div>
                    <Label htmlFor="cat_id">Select Your Cat *</Label>
                    <Select value={bookingData.cat_id} onValueChange={(value) => handleInputChange('cat_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your cat" />
                      </SelectTrigger>
                      <SelectContent>
                        {cats?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            <div className="flex items-center gap-2">
                              <PawPrint className="h-4 w-4" />
                              <span>{cat.name} ({cat.breed || 'Mixed'} • {cat.gender})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cats?.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        No cats found. <a href="/dashboard/cats/new" className="text-orange-500">Add a cat first</a>
                      </p>
                    )}
                  </div>

                  {/* Room Selection */}
                  <div>
                    <Label htmlFor="room_id">Select Room *</Label>
                    <Select value={bookingData.room_id} onValueChange={(value) => handleInputChange('room_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms?.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <Hotel className="h-4 w-4" />
                                <span>{room.name}</span>
                                <Badge variant="outline">{room.room_type}</Badge>
                              </div>
                              <span className="font-semibold">${room.price_per_day}/day</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="check_in_date">Check-in Date *</Label>
                      <Input
                        id="check_in_date"
                        type="date"
                        value={bookingData.check_in_date}
                        onChange={(e) => handleInputChange('check_in_date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="check_out_date">Check-out Date *</Label>
                      <Input
                        id="check_out_date"
                        type="date"
                        value={bookingData.check_out_date}
                        onChange={(e) => handleInputChange('check_out_date', e.target.value)}
                        min={bookingData.check_in_date || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  {pricing.days > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>{pricing.days} nights</strong> • 
                        Base rate: <strong>${pricing.roomPrice.toFixed(2)}</strong>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Services & Food */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Services */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Additional Services</CardTitle>
                        <CardDescription>Enhance your cat's stay with premium services</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={addService}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bookingData.services.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No services selected</p>
                    ) : (
                      <div className="space-y-4">
                        {bookingData.services.map((service, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">Service #{index + 1}</h4>
                              <Button variant="ghost" size="sm" onClick={() => removeService(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Service Type</Label>
                                <Select 
                                  value={service.service_id} 
                                  onValueChange={(value) => updateService(index, 'service_id', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose service" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {services?.map((s) => (
                                      <SelectItem key={s.id} value={s.id.toString()}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{s.name}</span>
                                          <span className="font-semibold ml-2">${s.price}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={service.quantity}
                                  onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label>Service Date</Label>
                                <Input
                                  type="date"
                                  value={service.service_date}
                                  onChange={(e) => updateService(index, 'service_date', e.target.value)}
                                  min={bookingData.check_in_date}
                                  max={bookingData.check_out_date}
                                />
                              </div>
                              <div>
                                <Label>Notes (Optional)</Label>
                                <Input
                                  placeholder="Special instructions"
                                  value={service.notes}
                                  onChange={(e) => updateService(index, 'notes', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Food */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Special Food</CardTitle>
                        <CardDescription>Premium food options for your cat</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={addFood}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Food
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bookingData.foods.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No special food selected - we'll use our standard premium food</p>
                    ) : (
                      <div className="space-y-4">
                        {bookingData.foods.map((food, index) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">Food #{index + 1}</h4>
                              <Button variant="ghost" size="sm" onClick={() => removeFood(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Food Type</Label>
                                <Select 
                                  value={food.food_id} 
                                  onValueChange={(value) => updateFood(index, 'food_id', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose food" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {foods?.map((f) => (
                                      <SelectItem key={f.id} value={f.id.toString()}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{f.name} ({f.category})</span>
                                          <span className="font-semibold ml-2">${f.price_per_serving}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Servings</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={food.quantity}
                                  onChange={(e) => updateFood(index, 'quantity', parseInt(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label>Feeding Date</Label>
                                <Input
                                  type="date"
                                  value={food.feeding_date}
                                  onChange={(e) => updateFood(index, 'feeding_date', e.target.value)}
                                  min={bookingData.check_in_date}
                                  max={bookingData.check_out_date}
                                />
                              </div>
                              <div>
                                <Label>Meal Time</Label>
                                <Select 
                                  value={food.meal_time} 
                                  onValueChange={(value) => updateFood(index, 'meal_time', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="breakfast">Breakfast</SelectItem>
                                    <SelectItem value="lunch">Lunch</SelectItem>
                                    <SelectItem value="dinner">Dinner</SelectItem>
                                    <SelectItem value="snack">Snack</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Special Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Special Requests</CardTitle>
                    <CardDescription>Any special instructions for your cat's care</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Tell us about your cat's special needs, preferences, or any instructions..."
                      value={bookingData.special_requests}
                      onChange={(e) => handleInputChange('special_requests', e.target.value)}
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Review & Book */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Review Your Booking
                  </CardTitle>
                  <CardDescription>
                    Please review all details before confirming
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Booking Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Cat Information</h4>
                      {selectedCat && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <PawPrint className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">{selectedCat.name}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {selectedCat.breed || 'Mixed'} • {selectedCat.gender} • 
                            {selectedCat.age ? ` ${selectedCat.age} years` : ' Age unknown'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Room Information</h4>
                      {selectedRoom && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Hotel className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{selectedRoom.name}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {selectedRoom.room_type} • ${selectedRoom.price_per_day}/night
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <h4 className="font-medium mb-3">Stay Duration</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Check-in</span>
                          <p className="font-medium">{new Date(bookingData.check_in_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Check-out</span>
                          <p className="font-medium">{new Date(bookingData.check_out_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration</span>
                          <p className="font-medium">{pricing.days} nights</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services & Food Summary */}
                  {(bookingData.services.length > 0 || bookingData.foods.length > 0) && (
                    <div>
                      <h4 className="font-medium mb-3">Additional Items</h4>
                      <div className="space-y-2">
                        {bookingData.services.map((service, index) => {
                          const serviceData = services?.find(s => s.id == service.service_id);
                          return serviceData ? (
                            <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                              <span>{serviceData.name} × {service.quantity}</span>
                              <span>${(serviceData.price * service.quantity).toFixed(2)}</span>
                            </div>
                          ) : null;
                        })}
                        {bookingData.foods.map((food, index) => {
                          const foodData = foods?.find(f => f.id == food.food_id);
                          return foodData ? (
                            <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                              <span>{foodData.name} × {food.quantity}</span>
                              <span>${(foodData.price_per_serving * food.quantity).toFixed(2)}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  {bookingData.special_requests && (
                    <div>
                      <h4 className="font-medium mb-3">Special Requests</h4>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{bookingData.special_requests}</p>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {isError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Booking Error</span>
                      </div>
                      <p className="text-red-600 text-sm mt-1">{error?.message}</p>
                    </div>
                  )}

                  {/* Confirm Button */}
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    size="lg"
                  >
                    {isLoading ? 'Creating Booking...' : `Confirm Booking - $${pricing.total.toFixed(2)}`}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                Previous
              </Button>
              <Button 
                onClick={() => setStep(Math.min(3, step + 1))}
                disabled={step === 3}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Next
              </Button>
            </div>
          </div>

          {/* Pricing Summary Sidebar */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRoom && pricing.days > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>{selectedRoom.name}</span>
                      <span>${selectedRoom.price_per_day}/night</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{pricing.days} nights</span>
                      <span>${pricing.roomPrice.toFixed(2)}</span>
                    </div>
                    
                    {pricing.servicesPrice > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Services</span>
                        <span>${pricing.servicesPrice.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {pricing.foodsPrice > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Special Food</span>
                        <span>${pricing.foodsPrice.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Select room and dates to see pricing</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBookingPage;