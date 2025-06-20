'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  ProductCard, 
  Badge,
  Button,
  Skeleton,
  EmotionIndicator,
  type Product,
  type EmotionHistoryEntry 
} from '@repo/ui';

interface RecommendationCategory {
  id: string;
  name: string;
  emotion: string;
  confidence: number;
  products: Product[];
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

interface RecommendationFilters {
  emotion?: string;
  category?: string;
  priceRange?: 'low' | 'medium' | 'high' | 'all';
  minConfidence?: number;
}

export default function RecommendationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendationCategory[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<RecommendationCategory[]>([]);
  const [filters, setFilters] = useState<RecommendationFilters>({ priceRange: 'all' });
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());

  // Mock user data
  const user = {
    name: 'Demo User',
    avatar: undefined,
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, recommendations]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Generate mock recommendations
      const mockRecommendations: RecommendationCategory[] = [
        {
          id: '1',
          name: 'Comfort & Wellness',
          emotion: 'sad',
          confidence: 0.85,
          priority: 'high',
          lastUpdated: new Date().toISOString(),
          reasoning: 'Based on your recent emotional state, we recommend comfort items and wellness products to help improve your mood.',
          products: [
            {
              id: '1',
              name: 'Aromatherapy Essential Oil Diffuser',
              price: 45.99,
              category: 'Wellness',
              rating: '4.8',
              image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Diffuser',
              description: 'Create a calming atmosphere with this premium essential oil diffuser',
            },
            {
              id: '2',
              name: 'Ultra Soft Weighted Blanket',
              price: 79.99,
              category: 'Home',
              rating: '4.7',
              image: 'https://via.placeholder.com/300x200/6b7280/ffffff?text=Blanket',
              description: 'Reduce anxiety and improve sleep with this therapeutic weighted blanket',
            },
            {
              id: '3',
              name: 'Meditation Cushion Set',
              price: 34.99,
              category: 'Wellness',
              rating: '4.6',
              image: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Meditation',
              description: 'Premium meditation cushions for mindfulness practice',
            },
          ],
        },
        {
          id: '2',
          name: 'Energy & Productivity',
          emotion: 'happy',
          confidence: 0.92,
          priority: 'high',
          lastUpdated: new Date().toISOString(),
          reasoning: 'Your positive energy suggests you\'re ready to tackle new challenges and boost productivity.',
          products: [
            {
              id: '4',
              name: 'Premium Workout Equipment Set',
              price: 199.99,
              category: 'Fitness',
              rating: '4.9',
              image: 'https://via.placeholder.com/300x200/ef4444/ffffff?text=Fitness',
              description: 'Complete home workout set for maintaining your active lifestyle',
            },
            {
              id: '5',
              name: 'Smart Productivity Planner',
              price: 29.99,
              category: 'Office',
              rating: '4.5',
              image: 'https://via.placeholder.com/300x200/f59e0b/ffffff?text=Planner',
              description: 'AI-powered planner to maximize your productive energy',
            },
            {
              id: '6',
              name: 'Energizing Green Tea Collection',
              price: 24.99,
              category: 'Food',
              rating: '4.4',
              image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Tea',
              description: 'Premium green tea blend for sustained natural energy',
            },
          ],
        },
        {
          id: '3',
          name: 'Entertainment & Fun',
          emotion: 'surprised',
          confidence: 0.78,
          priority: 'medium',
          lastUpdated: new Date().toISOString(),
          reasoning: 'Your sense of wonder suggests you\'re open to new experiences and entertainment.',
          products: [
            {
              id: '7',
              name: 'Virtual Reality Gaming Headset',
              price: 299.99,
              category: 'Electronics',
              rating: '4.8',
              image: 'https://via.placeholder.com/300x200/3b82f6/ffffff?text=VR',
              description: 'Immersive VR experience for gaming and exploration',
            },
            {
              id: '8',
              name: 'Puzzle Game Collection',
              price: 39.99,
              category: 'Games',
              rating: '4.6',
              image: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Puzzles',
              description: 'Challenging puzzles to stimulate your curious mind',
            },
            {
              id: '9',
              name: 'Art Supplies Starter Kit',
              price: 54.99,
              category: 'Arts',
              rating: '4.7',
              image: 'https://via.placeholder.com/300x200/f97316/ffffff?text=Art',
              description: 'Complete art kit for creative expression and discovery',
            },
          ],
        },
        {
          id: '4',
          name: 'Calm & Relaxation',
          emotion: 'neutral',
          confidence: 0.71,
          priority: 'low',
          lastUpdated: new Date().toISOString(),
          reasoning: 'Your balanced emotional state makes this a perfect time for relaxation and self-care.',
          products: [
            {
              id: '10',
              name: 'Luxury Bath Bomb Set',
              price: 32.99,
              category: 'Beauty',
              rating: '4.5',
              image: 'https://via.placeholder.com/300x200/ec4899/ffffff?text=Bath',
              description: 'Indulgent bath bombs for ultimate relaxation',
            },
            {
              id: '11',
              name: 'Mindfulness Journal',
              price: 18.99,
              category: 'Books',
              rating: '4.4',
              image: 'https://via.placeholder.com/300x200/6b7280/ffffff?text=Journal',
              description: 'Guided journal for mindfulness and reflection',
            },
          ],
        },
      ];

      setRecommendations(mockRecommendations);
      setCurrentEmotion(mockRecommendations[0]?.emotion || null);
      
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...recommendations];

    // Filter by emotion
    if (filters.emotion && filters.emotion !== 'all') {
      filtered = filtered.filter(rec => rec.emotion === filters.emotion);
    }

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(rec => 
        rec.products.some(product => 
          product.category.toLowerCase().includes(filters.category!.toLowerCase())
        )
      );
    }

    // Filter by price range
    if (filters.priceRange && filters.priceRange !== 'all') {
      filtered = filtered.filter(rec => {
        return rec.products.some(product => {
          switch (filters.priceRange) {
            case 'low':
              return product.price < 50;
            case 'medium':
              return product.price >= 50 && product.price <= 150;
            case 'high':
              return product.price > 150;
            default:
              return true;
          }
        });
      });
    }

    // Filter by confidence
    if (filters.minConfidence) {
      filtered = filtered.filter(rec => rec.confidence >= filters.minConfidence!);
    }

    // Sort by priority and confidence
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    setFilteredRecommendations(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const handleProductClick = (product: Product) => {
    console.log('Product clicked:', product);
    // Navigate to product detail page
  };

  const handleAddToCart = (product: Product) => {
    console.log('Add to cart:', product);
    // Add to cart logic
  };

  const handleSaveProduct = (product: Product) => {
    setSavedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(product.id)) {
        newSet.delete(product.id);
      } else {
        newSet.add(product.id);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <MainLayout
      title="Product Recommendations"
      user={user}
      currentPage="recommendations" 
      onSettingsClick={() => console.log('Settings clicked')}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Recommendations</h2>
            <p className="text-gray-600">AI-powered product suggestions based on your emotions</p>
            {currentEmotion && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-600">Current mood:</span>
                <EmotionIndicator 
                  emotion={currentEmotion as any}
                  size="sm"
                  showEmoji
                />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full mr-2" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </Button>
            <Button size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Saved ({savedProducts.size})
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Filter Recommendations</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Emotion Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emotion
                </label>
                <select
                  value={filters.emotion || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, emotion: e.target.value === 'all' ? undefined : e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Emotions</option>
                  <option value="happy">Happy</option>
                  <option value="sad">Sad</option>
                  <option value="angry">Angry</option>
                  <option value="surprised">Surprised</option>
                  <option value="fearful">Fearful</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value === 'all' ? undefined : e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="wellness">Wellness</option>
                  <option value="home">Home</option>
                  <option value="fitness">Fitness</option>
                  <option value="beauty">Beauty</option>
                  <option value="books">Books</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={filters.priceRange || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Prices</option>
                  <option value="low">Under $50</option>
                  <option value="medium">$50 - $150</option>
                  <option value="high">Over $150</option>
                </select>
              </div>

              {/* Confidence Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Confidence
                </label>
                <select
                  value={filters.minConfidence || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Any Confidence</option>
                  <option value="0.5">50%+</option>
                  <option value="0.7">70%+</option>
                  <option value="0.8">80%+</option>
                  <option value="0.9">90%+</option>
                </select>
              </div>
            </div>
            
            {(filters.emotion || filters.category || filters.priceRange !== 'all' || filters.minConfidence) && (
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="secondary">
                  {filteredRecommendations.length} recommendation{filteredRecommendations.length !== 1 ? 's' : ''}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilters({ priceRange: 'all' })}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <div className="space-y-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="border border-gray-200 rounded-lg p-4">
                        <Skeleton className="h-40 w-full mb-4" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredRecommendations.length > 0 ? (
            filteredRecommendations.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <EmotionIndicator 
                        emotion={category.emotion as any}
                        size="sm"
                        showEmoji
                        hideLabel
                      />
                      <div>
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{category.reasoning}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary"
                        className={getPriorityColor(category.priority)}
                      >
                        {category.priority} priority
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(category.confidence * 100)}% match
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        confidence={category.confidence}
                        isRecommended
                        size="md"
                        onClick={handleProductClick}
                        onAddToCart={handleAddToCart}
                        className="h-full"
                        actions={
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveProduct(product)}
                            className={savedProducts.has(product.id) ? 'text-red-600' : 'text-gray-600'}
                          >
                            <svg className="w-4 h-4" fill={savedProducts.has(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </Button>
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 mb-4">
                  No recommendations match your current filters
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Try adjusting your filters or start emotion detection to get personalized recommendations
                </p>
                <Button onClick={() => setFilters({ priceRange: 'all' })}>
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Insight */}
        {!isLoading && filteredRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">🤖 AI Recommendation Insights</h3>
            </CardHeader>
            <CardContent>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-primary-800 mb-3">
                  Based on your recent emotional patterns, we've curated {filteredRecommendations.length} recommendation categor{filteredRecommendations.length !== 1 ? 'ies' : 'y'} 
                  with {filteredRecommendations.reduce((total, cat) => total + cat.products.length, 0)} products that align with your current state.
                </p>
                <div className="flex flex-wrap gap-2">
                  {filteredRecommendations.map((category) => (
                    <Badge key={category.id} variant="secondary" className="bg-primary-100 text-primary-700">
                      {category.name}: {Math.round(category.confidence * 100)}%
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
