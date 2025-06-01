import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Clock, Users, Star, PawPrint, Camera, Gamepad2 } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <PawPrint className="h-16 w-16 text-orange-500 animate-bounce" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-orange-500">PetCare Hotel</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Premium cat boarding with love, care, and luxury. Your feline friends deserve the best vacation experience!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking/new">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3">
                  Book Now
                </Button>
              </Link>
              <Link href="/rooms">
                <Button variant="outline" size="lg" className="border-orange-500 text-orange-500 hover:bg-orange-50 px-8 py-3">
                  View Rooms
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 opacity-20">
          <PawPrint className="h-8 w-8 text-pink-400 animate-pulse" />
        </div>
        <div className="absolute top-20 right-20 opacity-20">
          <Heart className="h-6 w-6 text-red-400 animate-pulse delay-1000" />
        </div>
        <div className="absolute bottom-10 left-20 opacity-20">
          <Star className="h-10 w-10 text-yellow-400 animate-pulse delay-500" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose PetCare Hotel?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide exceptional care with premium amenities for your beloved cats
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-orange-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Safe & Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  24/7 monitoring and veterinary care on standby
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-pink-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Heart className="h-12 w-12 text-pink-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Loving Care</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Trained staff who genuinely love and care for cats
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-purple-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Flexible Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Easy online booking with flexible check-in/out times
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Expert Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Certified pet care professionals with years of experience
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Premium Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From grooming to playtime, we offer comprehensive care services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group hover:scale-105 transition-transform">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Camera className="h-8 w-8 text-blue-500" />
                  <div>
                    <CardTitle>Daily Photo Updates</CardTitle>
                    <CardDescription>See how your cat is doing</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Receive daily photos and updates about your cat's activities, meals, and mood.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-transform">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Gamepad2 className="h-8 w-8 text-green-500" />
                  <div>
                    <CardTitle>Interactive Playtime</CardTitle>
                    <CardDescription>Fun activities daily</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Structured play sessions with toys, climbing trees, and interactive games.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-transform">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Heart className="h-8 w-8 text-red-500" />
                  <div>
                    <CardTitle>Grooming & Spa</CardTitle>
                    <CardDescription>Pamper your pet</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Professional grooming services including baths, nail trimming, and brushing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Happy Pet Parents</h2>
            <p className="text-gray-600">What our customers say about us</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                review: "My cat Luna absolutely loved her stay! The staff was amazing and I got daily updates.",
                rating: 5,
                cat: "Luna"
              },
              {
                name: "Mike Chen",
                review: "Professional service and clean facilities. My cats were well taken care of.",
                rating: 5,
                cat: "Milo & Bella"
              },
              {
                name: "Emma Wilson",
                review: "The photo updates were so sweet! I could see how happy my cat was every day.",
                rating: 5,
                cat: "Whiskers"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>Parent of {testimonial.cat}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 italic">"{testimonial.review}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-pink-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Give Your Cat the Best Care?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Book now and enjoy peace of mind while you're away
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-500 px-8 py-3">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;