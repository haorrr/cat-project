// src/app/dashboard/bookings/page.js
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Plus,
  Search,
  Eye,
  Hotel,
  PawPrint,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { useGetBooking } from '@/components/hooks/booking/useGetBooking';

const DashboardBookingsPage = () => {
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 10
  });

  const { bookings, pagination, isLoading, isError, error, refetch } = useGetBooking(filters);

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

  const getStatusIcon = (status) => {
    const icons = {
      pending: AlertCircle,
      confirmed: CheckCircle,
      checked_in: CheckCircle,
      checked_out: CheckCircle,
      cancelled: XCircle
    };
    const Icon = icons[status] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDays = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600">Track your cat's hotel reservations</p>
        </div>
        <Link href="/booking/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-40">
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="min-w-40">
              <Input
                type="date"
                placeholder="Start Date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            
            <div className="min-w-40">
              <Input
                type="date"
                placeholder="End Date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
            
            <Button onClick={() => refetch()} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error: {error?.message}
        </div>
      )}

      {/* Empty State */}
      {bookings?.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-6">
              {filters.status || filters.start_date || filters.end_date 
                ? "Try adjusting your filters" 
                : "You haven't made any bookings yet"
              }
            </p>
            <Link href="/booking/new">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Booking
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      {bookings && bookings.length > 0 && (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={getStatusColor(booking.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(booking.status)}
                            <span className="capitalize">{booking.status.replace('_', ' ')}</span>
                          </div>
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Booking #{booking.id}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Cat & Room */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <PawPrint className="h-4 w-4 text-orange-500" />
                            <span className="font-medium text-gray-900">{booking.cat_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hotel className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-600">{booking.room_name}</span>
                          </div>
                        </div>

                        {/* Dates */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600">Duration</span>
                          </div>
                          <div className="text-sm">
                            <p className="font-medium">
                              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                            </p>
                            <p className="text-gray-500">
                              {calculateDays(booking.check_in_date, booking.check_out_date)} nights
                            </p>
                          </div>
                        </div>

                        {/* Price */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-purple-500" />
                            <span className="text-sm text-gray-600">Total</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${parseFloat(booking.total_price).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info (if available) */}
                      {booking.customer_name && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                          <span>Customer: {booking.customer_name}</span>
                          {booking.customer_email && (
                            <span className="ml-4">• {booking.customer_email}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:w-auto">
                      <Link href={`/dashboard/bookings/${booking.id}`}>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      
                      {booking.status === 'pending' && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full sm:w-auto"
                          onClick={() => {
                            // Handle cancel booking
                            if (confirm('Are you sure you want to cancel this booking?')) {
                              // Call cancel API
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      
                      {booking.status === 'checked_out' && (
                        <Link href={`/dashboard/reviews/new?booking_id=${booking.id}`}>
                          <Button size="sm" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
                            Write Review
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
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

      {/* Quick Stats */}
      {bookings && bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'checked_in').length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {bookings.filter(b => b.status === 'checked_out').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                ${bookings.reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardBookingsPage;