import React from 'react';
import { Card, CardContent, CardFooter } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

export interface Product {
  id: number | string;
  name: string;
  price: number;
  category: string;
  rating?: string | number;
  image: string;
  description?: string;
}

export interface ProductCardProps {
  /**
   * Product data
   */
  product: Product;
  /**
   * Confidence level for the recommendation (0-1)
   */
  confidence?: number;
  /**
   * Whether this is a recommended product
   */
  isRecommended?: boolean;
  /**
   * Click handler for the product
   */
  onClick?: (product: Product) => void;
  /**
   * Add to cart handler
   */
  onAddToCart?: (product: Product) => void;
  /**
   * Add to wishlist handler
   */
  onAddToWishlist?: (product: Product) => void;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show the confidence badge
   */
  showConfidence?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  confidence,
  isRecommended = false,
  onClick,
  onAddToCart,
  onAddToWishlist,
  size = 'md',
  showConfidence = true,
  className = '',
}) => {
  const { name, price, category, rating, image, description } = product;
  
  // Size classes
  const sizeClasses = {
    sm: {
      card: 'max-w-xs',
      image: 'h-32',
      title: 'text-sm',
      price: 'text-base',
      description: 'text-xs',
    },
    md: {
      card: 'max-w-sm',
      image: 'h-48',
      title: 'text-base',
      price: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      card: 'max-w-md',
      image: 'h-64',
      title: 'text-lg',
      price: 'text-xl',
      description: 'text-base',
    },
  };

  const currentSize = sizeClasses[size];
  const confidencePercentage = confidence ? Math.round(confidence * 100) : 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  return (
    <Card
      className={`
        ${currentSize.card} cursor-pointer transition-all duration-200
        hover:shadow-lg hover:scale-[1.02]
        ${isRecommended ? 'ring-2 ring-primary-300 ring-opacity-50' : ''}
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={image}
          alt={name}
          className={`
            w-full object-cover transition-transform duration-300 hover:scale-110
            ${currentSize.image}
          `}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/300x200/e5e5e5/666666?text=${encodeURIComponent(name)}`;
          }}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {isRecommended && (
            <Badge variant="default" size="sm">
              ⭐ Recommended
            </Badge>
          )}
          {showConfidence && confidence && (
            <Badge 
              variant="secondary" 
              size="sm"
              className="bg-white/90 text-gray-700"
            >
              {confidencePercentage}% match
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        {onAddToWishlist && (
          <button
            onClick={handleAddToWishlist}
            className="
              absolute top-2 right-2 p-2 bg-white/90 rounded-full
              hover:bg-white transition-colors duration-200
              text-gray-600 hover:text-red-500
            "
            aria-label="Add to wishlist"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <CardContent className="p-4">
        {/* Category */}
        <Badge variant="outline" size="sm" className="mb-2">
          {category}
        </Badge>

        {/* Title */}
        <h3 className={`font-semibold text-gray-900 mb-2 line-clamp-2 ${currentSize.title}`}>
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className={`text-gray-600 mb-3 line-clamp-2 ${currentSize.description}`}>
            {description}
          </p>
        )}

        {/* Price and Rating */}
        <div className="flex items-center justify-between">
          <span className={`font-bold text-green-600 ${currentSize.price}`}>
            ${typeof price === 'number' ? price.toFixed(2) : price}
          </span>
          
          {rating && (
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-gray-600">{rating}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      {onAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            variant="primary"
            size={size === 'sm' ? 'sm' : 'md'}
            className="w-full"
          >
            🛒 Add to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export { ProductCard };
