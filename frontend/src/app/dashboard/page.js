// src/app/dashboard/page.js
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PawPrint,
  Calendar,
  CreditCard,
  Star,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useGetUser } from '@/components/hooks/auth/useGetUser';
import { useGetCats } from '@/components/hooks/cat/useGetCats';
import { useGetBooking } from '@/components/hooks/booking/useGetBooking';

const DashboardPage = () => {
  const { user } = useGetUser();
  const { cats } = useGetCats({ active_only: true, limit: 5 });
  const { bookings } = useGetBooking({ limit: 5 });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      checked_in: 'bg-green-100 text-green-800',
      checked_out: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Stats calculation
  const totalCats = cats?.length || 0;
  const totalBookings = bookings?.length || 0;
  const activeBookings = bookings?.filter(b => ['confirmed', 'checked_in'].includes(b.status))?.length || 0;
  const totalSpent = bookings?.reduce((sum, booking) => sum + (parseFloat(booking.total_price) || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name}!</h1>
        <p className="text-orange-100">
          Here's what's happening with your cats and bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cats</CardTitle>
            <PawPrint className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCats}</div>
            <p className="text-xs text-muted-foreground">
              Registered cats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBookings}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              All time bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time spending
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Bookings</CardTitle>
              <Link href="/dashboard/bookings">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>
              Your latest booking activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{booking.cat_name}</p>
                        <Badge className={getStatusColor(booking.status)} size="sm">
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                      </p>
                      <p className="text-xs text-gray-600">{booking.room_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">${booking.total_price}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-3">No bookings yet</p>
                <Link href="/booking/new">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Booking
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Cats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Cats</CardTitle>
              <Link href="/dashboard/cats">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>
              Your registered cats
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cats && cats.length > 0 ? (
              <div className="space-y-3">
                {cats.slice(0, 3).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <PawPrint className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cat.name}</p>
                        <p className="text-xs text-gray-500">
                          {cat.breed && `${cat.breed} • `}
                          {cat.gender} • {cat.age ? `${cat.age} years` : 'Age unknown'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={cat.is_active ? "default" : "secondary"} size="sm">
                      {cat.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-3">No cats registered yet</p>
                <Link href="/dashboard/cats/new">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Cat
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks you might want to do
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/cats/new">
              <Button variant="outline" className="w-full h-16 flex-col gap-2">
                <Plus className="h-5 w-5" />
                <span>Add New Cat</span>
              </Button>
            </Link>
            
            <Link href="/booking/new">
              <Button variant="outline" className="w-full h-16 flex-col gap-2">
                <Calendar className="h-5 w-5" />
                <span>Create Booking</span>
              </Button>
            </Link>
            
            <Link href="/rooms">
              <Button variant="outline" className="w-full h-16 flex-col gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>Browse Rooms</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Activity items would come from an API */}
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Welcome to PetCare Hotel! Complete your profile to get started.</p>
                <p className="text-xs text-gray-500 mt-1">Just now</p>
              </div>
            </div>
            
            {bookings && bookings.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm">Your booking for {bookings[0]?.cat_name} is {bookings[0]?.status}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(bookings[0]?.created_at)}</p>
                </div>
              </div>
            )}
            
            {cats && cats.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm">Cat profile for {cats[0]?.name} was created successfully</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(cats[0]?.created_at)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;