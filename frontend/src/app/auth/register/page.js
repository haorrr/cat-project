// src/app/auth/register/page.js
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PawPrint } from 'lucide-react';
import { Register } from '@/components/auth/Register';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <PawPrint className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">PetCare Hotel</span>
          </Link>
          <p className="mt-2 text-gray-600">Join us and give your cats the best care</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Sign up to start booking premium cat care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Register />
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-orange-500 hover:text-orange-600 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;