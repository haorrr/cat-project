"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateCat } from '@/components/cat/CreateCat';
import { PawPrint } from 'lucide-react';

const NewCatPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Cat</h1>
        <p className="text-gray-600">Register your cat to start booking stays</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-orange-500" />
            Cat Information
          </CardTitle>
          <CardDescription>
            Please provide your cat's details for our records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCat />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewCatPage;