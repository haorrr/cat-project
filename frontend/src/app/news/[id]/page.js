// src/app/news/[id]/page.js
"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Eye,
  User,
  ArrowLeft,
  Share2,
  Heart,
  MessageSquare,
  Clock,
  Tag
} from 'lucide-react';
import { useGetNewsArticle } from '@/components/hooks/news/useGetNewsArticle';

const NewsArticlePage = () => {
  const params = useParams();
  const articleId = params.id;
  
  const { article, isLoading, isError, error } = useGetNewsArticle(articleId);

  const categoryColors = {
    tips: "bg-blue-100 text-blue-800",
    health: "bg-red-100 text-red-800",
    events: "bg-green-100 text-green-800",
    updates: "bg-yellow-100 text-yellow-800",
    general: "bg-gray-100 text-gray-800"
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const estimateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content?.split(' ').length || 0;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="w-32 h-10 bg-gray-200 rounded mb-6"></div>
            <div className="w-full h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h2>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link href="/news">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/news" className="text-gray-500 hover:text-gray-700">News</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 truncate">{article.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/news">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          {/* Category and Metadata */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Badge className={categoryColors[article.category] || categoryColors.general}>
              <Tag className="h-3 w-3 mr-1" />
              {article.category?.charAt(0).toUpperCase() + article.category?.slice(1)}
            </Badge>
            
            <div className="flex items-center text-sm text-gray-500 gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{article.views || 0} views</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{estimateReadingTime(article.content)} min read</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* Author and Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{article.author_name}</p>
                <p className="text-sm text-gray-500">
                  {article.author_email && `${article.author_email} • `}
                  Staff Writer
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.featured_image && (
          <div className="mb-8">
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-lg max-w-none mb-12">
          <div 
            className="text-gray-700 leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ 
              __html: article.content?.replace(/\n/g, '<br/>') || '' 
            }}
          />
        </article>

        {/* Article Footer */}
        <footer className="border-t pt-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Share this article:</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Last updated: {formatDate(article.updated_at)}
            </div>
          </div>

          {/* Author Bio */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    About {article.author_name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {article.author_name} is a staff writer at PetCare Hotel, specializing in cat care, 
                    health tips, and pet hospitality. With years of experience in the pet care industry, 
                    they provide expert insights to help pet parents make the best decisions for their feline friends.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </footer>

        {/* Related Articles */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* These would be fetched from an API */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <img
                  src="/api/placeholder/400/200"
                  alt="Related article"
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <Badge className="mb-2 bg-blue-100 text-blue-800">Tips</Badge>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    5 Essential Tips for First-Time Cat Boarding
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    Preparing your cat for their first hotel stay can be stressful. Here are our top tips...
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <img
                  src="/api/placeholder/400/200"
                  alt="Related article"
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <Badge className="mb-2 bg-red-100 text-red-800">Health</Badge>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    Understanding Cat Anxiety During Boarding
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    Learn how to recognize and help reduce your cat's anxiety during their stay...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NewsArticlePage;