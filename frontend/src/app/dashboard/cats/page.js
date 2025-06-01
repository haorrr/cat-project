// src/app/dashboard/cats/page.js
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PawPrint,
  Plus,
  Search,
  Edit,
  Calendar,
  Heart,
  Star,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { useGetCats } from '@/components/hooks/cat/useGetCats';

const DashboardCatsPage = () => {
  const [filters, setFilters] = useState({
    search: '',
    breed: '',
    gender: '',
    active_only: true,
    page: 1,
    limit: 12
  });

  const { cats, pagination, isLoading, isError, error, refetch } = useGetCats(filters);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">My Cats</h1>
          <p className="text-gray-600">Manage your registered cats</p>
        </div>
        <Link href="/dashboard/cats/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Add New Cat
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search cats by name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="min-w-32">
              <Select value={filters.breed} onValueChange={(value) => handleFilterChange('breed', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Breeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Breeds</SelectItem>
                  <SelectItem value="Persian">Persian</SelectItem>
                  <SelectItem value="Maine Coon">Maine Coon</SelectItem>
                  <SelectItem value="Siamese">Siamese</SelectItem>
                  <SelectItem value="British Shorthair">British Shorthair</SelectItem>
                  <SelectItem value="Ragdoll">Ragdoll</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="min-w-28">
              <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={() => refetch()} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
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
      {cats?.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <PawPrint className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cats found</h3>
            <p className="text-gray-500 mb-6">
              {filters.search || filters.breed || filters.gender 
                ? "Try adjusting your search criteria" 
                : "Get started by adding your first cat"
              }
            </p>
            <Link href="/dashboard/cats/new">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Cat
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Cats Grid */}
      {cats && cats.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cats.map((cat) => (
              <Card key={cat.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <PawPrint className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cat.name}</CardTitle>
                        <CardDescription>
                          {cat.breed || 'Mixed'} • {cat.gender}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={cat.is_active ? "default" : "secondary"}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Age:</span>
                        <p className="font-medium">{cat.age ? `${cat.age} years` : 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Weight:</span>
                        <p className="font-medium">{cat.weight ? `${cat.weight} kg` : 'Unknown'}</p>
                      </div>
                    </div>

                    {cat.color && (
                      <div className="text-sm">
                        <span className="text-gray-500">Color:</span>
                        <p className="font-medium">{cat.color}</p>
                      </div>
                    )}

                    {cat.vaccination_status && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Vaccinated</span>
                      </div>
                    )}

                    {/* Owner Info */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Mail className="h-3 w-3" />
                        <span>{cat.owner_email}</span>
                      </div>
                      {cat.owner_phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{cat.owner_phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Recent Bookings */}
                    {cat.recent_bookings && cat.recent_bookings.length > 0 && (
                      <div className="pt-3 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Bookings</h4>
                        <div className="space-y-1">
                          {cat.recent_bookings.slice(0, 2).map((booking) => (
                            <div key={booking.id} className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(booking.check_in_date).toLocaleDateString()} - {booking.room_name}
                              </span>
                              <Badge size="sm" variant="outline">{booking.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medical Notes Preview */}
                    {cat.medical_notes && (
                      <div className="pt-3 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Medical Notes</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{cat.medical_notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3">
                      <Link href={`/dashboard/cats/${cat.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/booking/new?cat_id=${cat.id}`} className="flex-1">
                        <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Book
                        </Button>
                      </Link>
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
    </div>
  );
};

export default DashboardCatsPage;