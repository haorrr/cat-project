// src/app/news/page.js
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
  Eye,
  User,
  Search,
  Heart,
  Stethoscope,
  CalendarDays,
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useGetNews } from '@/components/hooks/news/useGetNews';

const NewsPage = () => {
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    published_only: true,
    page: 1,
    limit: 9
  });

  const { news, pagination, isLoading, isError, error, refetch } = useGetNews(filters);

  const categoryColors = {
    tips: "bg-blue-100 text-blue-800",
    health: "bg-red-100 text-red-800",
    events: "bg-green-100 text-green-800",
    updates: "bg-yellow-100 text-yellow-800",
    general: "bg-gray-100 text-gray-800"
  };

  const categoryIcons = {
    tips: Heart,
    health: Stethoscope,
    events: CalendarDays,
    updates: MessageSquare,
    general: MessageSquare
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = () => {
    refetch();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Pet Care News & Tips</h1>
            <p className="text-xl text-blue-100">
              Stay updated with the latest in cat care, health tips, and hotel news
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search articles..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="min-w-48">
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="tips">Care Tips</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="updates">Updates</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleSearch} className="bg-blue-500 hover:bg-blue-600">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* News Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            Error: {error?.message}
          </div>
        )}

        {news?.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            {/* Featured Article (First Article) */}
            {news && news.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Featured Article</h2>
                <Card className="overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/2">
                      <img
                        src={news[0].featured_image || "/api/placeholder/600/400"}
                        alt={news[0].title}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-1/2 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={categoryColors[news[0].category] || categoryColors.general}>
                          {news[0].category?.charAt(0).toUpperCase() + news[0].category?.slice(1)}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500 gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(news[0].published_at || news[0].created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {news[0].views || 0} views
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3">{news[0].title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {news[0].excerpt || news[0].content?.substring(0, 200) + '...'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="h-4 w-4" />
                          <span>By {news[0].author_name}</span>
                        </div>
                        <Link href={`/news/${news[0].id}`}>
                          <Button className="bg-blue-500 hover:bg-blue-600">
                            Read More
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Other Articles Grid */}
            {news && news.length > 1 && (
              <>
                <h2 className="text-2xl font-bold mb-6">Latest Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {news.slice(1).map((article) => {
                    const Icon = categoryIcons[article.category] || MessageSquare;
                    return (
                      <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <img
                            src={article.featured_image || "/api/placeholder/400/250"}
                            alt={article.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-4 left-4">
                            <Badge className={categoryColors[article.category] || categoryColors.general}>
                              <Icon className="h-3 w-3 mr-1" />
                              {article.category?.charAt(0).toUpperCase() + article.category?.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <CardHeader>
                          <div className="flex items-center text-sm text-gray-500 gap-4 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(article.published_at || article.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.views || 0}
                            </div>
                          </div>
                          <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                        </CardHeader>

                        <CardContent>
                          <CardDescription className="line-clamp-3 mb-4">
                            {article.excerpt || article.content?.substring(0, 150) + '...'}
                          </CardDescription>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <User className="h-3 w-3" />
                              <span>{article.author_name}</span>
                            </div>
                            <Link href={`/news/${article.id}`}>
                              <Button variant="outline" size="sm">
                                Read More
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => handleFilterChange('page', pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600">
                  Page {pagination.current_page} of {pagination.total_pages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => handleFilterChange('page', pagination.current_page + 1)}
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

export default NewsPage;