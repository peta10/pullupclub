import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import CacheManager, { CACHE_EXPIRY } from '../utils/cacheManager';

interface CachedImageProps {
  uri: string;
  style?: string;
  alt?: string;
  cacheKey: string;
  placeholder?: React.ReactNode;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

// Example usage:
// <CachedImage uri="/badge1.png" cacheKey="badge_1" style="h-16 w-16" alt="Badge" />

const CachedImage: React.FC<CachedImageProps> = ({ 
  uri, 
  style, 
  alt, 
  cacheKey, 
  placeholder, 
  width, 
  height, 
  priority = false, 
  sizes 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cachedUri, setCachedUri] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const cached = await CacheManager.getCache(cacheKey);
        if (cached && typeof cached === 'string') {
          if (isMounted) {
            setCachedUri(cached);
            setLoading(false);
          }
          return;
        }
        // Verify image loads
        const img = new window.Image();
        img.src = uri;
        img.onload = () => {
          if (isMounted) {
            setCachedUri(uri);
            setLoading(false);
          }
          CacheManager.setCache(cacheKey, uri, CACHE_EXPIRY.badges);
        };
        img.onerror = () => {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        };
      } catch (err) {
        console.log('CachedImage error', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [uri, cacheKey]);

  if (loading) {
    return (
      <>{placeholder || <div>Loading...</div>}</>
    );
  }
  if (error) {
    return (
      <>{placeholder || <div>Image unavailable</div>}</>
    );
  }
  return (
    <Image
      src={cachedUri || uri}
      className={style}
      alt={alt || 'Cached image'}
      width={width || 400}
      height={height || 300}
      sizes={sizes}
      onError={() => setError(true)}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  );
};

export default CachedImage; 