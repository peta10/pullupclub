import React, { useState, useEffect, useRef } from 'react';

interface YouTubeEmbedProps {
  embedId: string;
  autoplayOnScroll?: boolean;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ embedId, autoplayOnScroll = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePlay = () => {
    console.log('YouTube embed: Starting playback for video:', embedId);
    setIsLoading(true);
    setIsPlaying(true);
    setError(null);
  };

  const handleIframeError = () => {
    console.error('YouTube embed: Failed to load iframe');
    setError('Failed to load video. Please try again.');
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleIframeLoad = () => {
    console.log('YouTube iframe loaded successfully');
    setIsLoading(false);
    setError(null);
  };

  // Intersection Observer for scroll-triggered autoplay
  useEffect(() => {
    if (!autoplayOnScroll || !containerRef.current || hasBeenInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            console.log('YouTube embed: Video in view, starting muted autoplay');
            setHasBeenInView(true);
            setIsLoading(true);
            setIsPlaying(true);
            setError(null);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the video is visible
        rootMargin: '0px 0px -100px 0px' // Start a bit before it's fully in view
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [autoplayOnScroll, embedId, hasBeenInView]);

  if (error) {
    return (
      <div className="relative bg-gray-800 flex items-center justify-center w-full" style={{ height: '315px' }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={handlePlay}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div style={{ width: '100%', height: '315px' }}>
        <iframe 
          src={`https://www.youtube-nocookie.com/embed/${embedId}?autoplay=1&mute=1&loop=1&playlist=${embedId}&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
          width="100%" 
          height="315"
          frameBorder="0"
          allowFullScreen
          title="Pull-Up Demo"
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
          onError={handleIframeError}
          onLoad={handleIframeLoad}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative cursor-pointer bg-gray-800 aspect-video flex items-center justify-center w-full"
      style={{ height: '315px' }}
      onClick={handlePlay}
    >
      {/* YouTube thumbnail background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://img.youtube.com/vi/${embedId}/maxresdefault.jpg)`
        }}
      />
      
      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-30 transition-all duration-200">
        {/* Play button */}
        <div className="bg-red-600 rounded-full p-4 hover:bg-red-700 transition-colors transform hover:scale-110">
          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      
      {/* Click to play text */}
      <span className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
        {autoplayOnScroll ? 'Scroll to autoplay or click to play' : 'Click to play demo'}
      </span>
    </div>
  );
};

export default YouTubeEmbed; 