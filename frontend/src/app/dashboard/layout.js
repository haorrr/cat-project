// src/app/dashboard/layout.js
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PawPrint,
  Calendar,
  User,
  Settings,
  BookOpen,
  CreditCard,
  Star,
  Plus
} from 'lucide-react';
import { useGetUser } from '@/components/hooks/auth/useGetUser';

const DashboardLayout = ({ children }) => {
  const pathname = usePathname();
  const { user, isLoading } = useGetUser();

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: BookOpen, exact: true },
    { name: 'My Cats', href: '/dashboard/cats', icon: PawPrint },
    { name: 'Bookings', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  const isActive = (href, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please login to access your dashboard</p>
            <Link href="/auth/login" className="text-orange-500 hover:text-orange-600">
              Go to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-6">
                <PawPrint className="h-8 w-8 text-orange-500" />
                <span className="ml-2 text-lg font-semibold text-gray-900">Dashboard</span>
              </div>
              
              {/* User Info */}
              <div className="px-4 mb-6">
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        active
                          ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${
                          active ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <div className="px-4 mt-8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/dashboard/cats/new"
                    className="flex items-center text-sm text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Cat
                  </Link>
                  <Link
                    href="/booking/new"
                    className="flex items-center text-sm text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:hidden">
            {/* Mobile navigation would go here */}
            <div className="flex-1 px-4 flex justify-between items-center">
              <div className="flex items-center">
                <PawPrint className="h-6 w-6 text-orange-500" />
                <span className="ml-2 text-lg font-semibold text-gray-900">Dashboard</span>
              </div>
            </div>
          </div>

          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;