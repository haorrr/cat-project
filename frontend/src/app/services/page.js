// src/app/services/page.js
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building,
  Heart,
  Scissors,
  Stethoscope,
  Camera,
  Car,
  Coffee,
  Bath,
  ArrowLeft,
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
  Users,
  Shield,
  Award,
  CheckCircle,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Activity,
  Zap
} from "lucide-react";
import { useGetServicesList } from "../../components/hooks/service/useGetServicesList";

export default function PublicServicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);

  const { 
    data: servicesData,
    isLoading,
    isError,
    error
  } = useGetServicesList({
    search: searchTerm,
    category: selectedCategory,
    active_only: true
  });

  const services = servicesData?.services || [];

  const serviceCategories = [
    {
      value: "grooming",
      label: "Grooming & Spa",
      icon: Scissors,
      color: "bg-pink-100 text-pink-800",
      description: "Professional grooming and spa treatments for your cats"
    },
    {
      value: "healthcare",
      label: "Healthcare",
      icon: Stethoscope,
      color: "bg-blue-100 text-blue-800",
      description: "Health checkups and medical care services"
    },
    {
      value: "entertainment",
      label: "Entertainment",
      icon: Camera,
      color: "bg-purple-100 text-purple-800",
      description: "Fun activities and enrichment for your cats"
    },
    {
      value: "transport",
      label: "Transport",
      icon: Car,
      color: "bg-green-100 text-green-800",
      description: "Safe pickup and delivery services"
    },
    {
      value: "dining",
      label: "Premium Dining",
      icon: Coffee,
      color: "bg-orange-100 text-orange-800",
      description: "Gourmet meals and special dietary plans"
    },
    {
      value: "wellness",
      label: "Wellness",
      icon: Activity,
      color: "bg-teal-100 text-teal-800",
      description: "Wellness programs and therapeutic services"
    }
  ];

  const serviceIcons = {
    'grooming': Scissors,
    'healthcare': Stethoscope,
    'entertainment': Camera,
    'transport': Car,
    'dining': Coffee,
    'wellness': Activity,
    'spa': Bath,
    'checkup': Stethoscope,
    'playtime': Heart,
    'massage': Sparkles
  };

  const getCategoryInfo = (category) => {
    return serviceCategories.find(cat => cat.value === category) || 
           { label: category, icon: Heart, color: "bg-gray-100 text-gray-800" };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const createImagePlaceholder = (serviceName) => {
    const safeName = serviceName ? serviceName.replace(/[^\x00-\x7F]/g, "Service") : "Service";
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
    setSelectedCategory("");
    setPriceRange({ min: "", max: "" });
  };

  // Filter services by search term and price range (client-side)
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = (!priceRange.min || service.price >= parseFloat(priceRange.min)) &&
                        (!priceRange.max || service.price <= parseFloat(priceRange.max));
    
    return matchesSearch && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Cat Hotel</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/rooms" className="text-gray-600 hover:text-gray-900 transition-colors">
                Rooms
              </Link>
              <Link href="/auth" className="text-gray-600 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link
                href="/auth"
                className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200"
              >
                Book Services
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Premium Services for Your Beloved Cats
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            From professional grooming to health checkups, we offer comprehensive care services 
            designed to keep your cats healthy, happy, and pampered.
          </p>
          
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-purple-500 mb-2">{services.length || 0}</div>
              <div className="text-gray-600">Available Services</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-pink-500 mb-2">24/7</div>
              <div className="text-gray-600">Emergency Care</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-blue-500 mb-2">100%</div>
              <div className="text-gray-600">Professional Staff</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-3xl font-bold text-green-500 mb-2">5★</div>
              <div className="text-gray-600">Customer Rating</div>
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
                placeholder="Search services by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
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
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {serviceCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="$0.00"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="$999.99"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
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

        {/* Service Categories Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {serviceCategories.map((category) => {
            const categoryServices = services.filter(s => s.category === category.value) || [];
            const Icon = category.icon;
            
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(selectedCategory === category.value ? "" : category.value)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedCategory === category.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className={`inline-flex p-3 rounded-xl ${category.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{category.label}</h3>
                <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                <p className="text-xs text-gray-500">{categoryServices.length} services available</p>
              </button>
            );
          })}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">
              {filteredServices.length} services found
              {selectedCategory && ` in ${getCategoryInfo(selectedCategory).label}`}
            </p>
            {isLoading && (
              <div className="flex items-center text-purple-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <Heart className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Services</h3>
            <p className="text-gray-600 mb-4">{error?.message || "Something went wrong"}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Services Grid */}
        {!isLoading && !isError && filteredServices.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const categoryInfo = getCategoryInfo(service.category);
              const CategoryIcon = categoryInfo.icon;
              const ServiceIcon = serviceIcons[service.service_type] || CategoryIcon;
              
              return (
                <div 
                  key={service.id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 group"
                >
                  {/* Service Image */}
                  <div className="relative">
                    <div className="relative h-48 overflow-hidden rounded-t-2xl">
                      {service.image_url ? (
                        <Image
                          src={service.image_url.startsWith('http') ? service.image_url : `http://localhost:5000${service.image_url}`}
                          alt={service.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized={true}
                          onError={(e) => {
                            e.target.src = createImagePlaceholder(service.name);
                          }}
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center h-full">
                          <ServiceIcon className="h-16 w-16 text-purple-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                    </div>

                    {/* Popular Badge */}
                    {service.is_popular && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Service Content */}
                  <div className="p-6">
                    {/* Service Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`inline-flex p-2 rounded-lg ${categoryInfo.color}`}>
                        <ServiceIcon className="h-5 w-5" />
                      </div>
                      {service.duration && (
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm">{service.duration} min</span>
                        </div>
                      )}
                    </div>

                    {/* Service Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                      {service.description && (
                        <p className="text-gray-600 text-sm line-clamp-3">{service.description}</p>
                      )}
                    </div>

                    {/* Service Details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span className="text-sm">Price</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(service.price)}
                        </span>
                      </div>

                      {service.max_capacity && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span className="text-sm">Capacity</span>
                          </div>
                          <span className="text-sm text-gray-900">
                            Up to {service.max_capacity} cats
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Availability</span>
                        </div>
                        <span className={`text-sm font-medium ${
                          service.is_active ? "text-green-600" : "text-red-600"
                        }`}>
                          {service.is_active ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </div>

                    {/* Features/Benefits */}
                    {service.features && service.features.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Includes</h4>
                        <div className="space-y-2">
                          {service.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                          {service.features.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{service.features.length - 3} more features
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Link
                        href="/auth"
                        className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all duration-200 flex items-center justify-center"
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        Book Service
                      </Link>
                      
                      <div className="flex space-x-2">
                        <Link
                          href={`/services/${service.id}`}
                          className="flex-1 text-purple-600 hover:text-purple-700 text-sm font-medium py-2 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors duration-200 flex items-center justify-center"
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Learn More
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
        {!isLoading && !isError && filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Heart className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || selectedCategory || priceRange.min || priceRange.max
                ? "Try adjusting your search filters to find available services."
                : "No services are currently available. Please check back later."}
            </p>
            {(searchTerm || selectedCategory || priceRange.min || priceRange.max) && (
              <button
                onClick={clearFilters}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Why Choose Our Services Section */}
        <div className="mt-16 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Our Services?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Professionals</h3>
              <p className="text-gray-600">
                Our certified specialists have years of experience and genuine love for cats.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Safe & Gentle</h3>
              <p className="text-gray-600">
                We use gentle techniques and premium products to ensure your cat's comfort and safety.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Convenient Booking</h3>
              <p className="text-gray-600">
                Easy online booking with flexible scheduling to fit your busy lifestyle.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Pamper Your Cat?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Book our premium services and give your cat the care they deserve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-200 flex items-center justify-center"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book Services
            </Link>
            <Link
              href="/contact"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
            >
              <Phone className="h-5 w-5 mr-2" />
              Contact Us
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
                <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-2 rounded-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">Cat Hotel</span>
              </div>
              <p className="text-gray-400 mb-4">
                Premium services and loving care for your beloved cats. 
                We provide professional, safe, and enjoyable experiences for every feline guest.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Our Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/services" className="hover:text-white transition-colors">All Services</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Grooming & Spa</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Healthcare</Link></li>
                <li><Link href="/services" className="hover:text-white transition-colors">Entertainment</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  (555) 123-4567
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  services@cathotel.com
                </li>
                <li className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  123 Pet Street, City
                </li>
                <li className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Mon-Sun: 7AM-9PM
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Cat Hotel. All rights reserved. Made with ❤️ for cats and their humans.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}