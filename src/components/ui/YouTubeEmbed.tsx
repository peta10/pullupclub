import React, { useState, useEffect, useRef, useCallback } from 'react';

interface YouTubeEmbedProps {
  embedId: string;
  autoplayOnScroll?: boolean;
  platform?: 'youtube' | 'vimeo';
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ embedId, autoplayOnScroll = true, platform = 'youtube' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleUserInteraction = useCallback(() => {
    console.log(`${platform} embed: User interaction detected - starting playback with audio`);
    setUserInteracted(true);
    setShowPlayPrompt(false);
    setIsLoading(true);
    setIsPlaying(true);
    setError(null);
  }, [platform]);

  const handleIframeError = useCallback(() => {
    console.error(`${platform} embed: Failed to load iframe`);
    setError('Failed to load video. Please try again.');
    setIsPlaying(false);
    setIsLoading(false);
  }, [platform]);

  // Handle iframe load and setup
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
    
    // For Vimeo, ensure audio works properly - faster attempts for mobile
    if (platform === 'vimeo' && iframeRef.current) {
      // Faster attempts with shorter delays
      const unmuteAttempts = isMobile ? [50, 150, 300] : [100, 250];
      
      unmuteAttempts.forEach((delay) => {
        setTimeout(() => {
          try {
            const iframe = iframeRef.current;
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage('{"method":"setVolume","value":1}', '*');
              iframe.contentWindow.postMessage('{"method":"setMuted","value":false}', '*');
              iframe.contentWindow.postMessage('{"method":"play"}', '*');
            }
          } catch (e) {
            console.log('PostMessage attempt failed:', e);
          }
        }, delay);
      });
    }
  }, [platform, userInteracted, isMobile]);

  // Intersection Observer for scroll-triggered autoplay
  useEffect(() => {
    if (!autoplayOnScroll || !containerRef.current || hasBeenInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            console.log(`${platform} embed: Video in view - starting autoplay`);
            setHasBeenInView(true);
            
            // On mobile, show interaction prompt instead of auto-playing
            if (isMobile && platform === 'vimeo' && !userInteracted) {
              setShowPlayPrompt(true);
              console.log('Mobile detected - showing play prompt');
              return;
            }
            
            // Auto-play for desktop - treat scroll as user interaction BEFORE starting video
            console.log('Desktop detected - treating scroll as user interaction');
            setUserInteracted(true);
            
            // Faster start for desktop autoplay
            setTimeout(() => {
              setIsLoading(true);
              setIsPlaying(true);
              setError(null);
            }, 25);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px' // Reduced margin for faster trigger
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [autoplayOnScroll, embedId, hasBeenInView, isMobile, platform, userInteracted]);

  const getEmbedUrl = useCallback(() => {
    if (platform === 'vimeo') {
      const baseUrl = `https://player.vimeo.com/video/${embedId}`;
      const params = new URLSearchParams({
        autoplay: '1',
        loop: '1',
        title: '0',
        byline: '0',
        portrait: '0',
        controls: '1',
        playsinline: '1',
        // Better mobile audio handling
        muted: (isMobile && !userInteracted) ? '1' : '0',
        volume: '1',
        background: '0',
        // Add preload for faster loading
        preload: 'auto'
      });
      
      console.log('Vimeo URL params:', params.toString(), 'userInteracted:', userInteracted, 'isMobile:', isMobile);
      return `${baseUrl}?${params.toString()}`;
    }
    
    // YouTube fallback
    const params = new URLSearchParams({
      autoplay: '1',
      mute: userInteracted ? '0' : '1',
      loop: '1',
      playlist: embedId,
      controls: '1',
      modestbranding: '1',
      rel: '0',
      playsinline: '1',
      enablejsapi: '1'
    });
    
    return `https://www.youtube-nocookie.com/embed/${embedId}?${params.toString()}`;
  }, [platform, embedId, userInteracted, isMobile]);

  const getThumbnailUrl = useCallback(() => {
    if (platform === 'vimeo') {
      // Multiple fallback URLs for better reliability
      return `https://i.vimeocdn.com/video/${embedId}_640x360.jpg`;
    }
    return `https://img.youtube.com/vi/${embedId}/maxresdefault.jpg`;
  }, [platform, embedId]);

  // Error state
  if (error) {
    return (
      <div className="relative bg-gray-800 flex items-center justify-center w-full" style={{ height: '315px' }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={handleUserInteraction}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Playing state
  if (isPlaying) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: '315px' }}>
        <iframe 
          ref={iframeRef}
          src={getEmbedUrl()}
          width="100%" 
          height="315"
          frameBorder="0"
          allowFullScreen
          title="Pull-Up Demo"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
          onError={handleIframeError}
          onLoad={handleIframeLoad}
        />
      </div>
    );
  }

  // Thumbnail state
  return (
    <div 
      ref={containerRef}
      className="relative cursor-pointer bg-black aspect-video flex items-center justify-center w-full"
      style={{ height: '315px' }}
      onClick={handleUserInteraction}
    >
      {/* Simple black background with play button */}
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-2 border-white/20 rounded-lg flex items-center justify-center mb-2 bg-black/50">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          {showPlayPrompt && isMobile && (
            <span className="text-sm text-white/80">Tap to play with sound</span>
          )}
        </div>
      </div>
      
      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center hover:bg-opacity-30 transition-all duration-200">
        {/* Play button */}
        <div className={`bg-red-600 rounded-full p-4 hover:bg-red-700 transition-all transform hover:scale-110 ${showPlayPrompt ? 'animate-pulse' : ''}`}>
          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
      
      {/* Interaction prompt */}
      <div className="absolute bottom-4 left-4 right-4">
        <span className="text-white text-sm font-medium bg-black bg-opacity-70 px-3 py-2 rounded-lg block text-center">
          {showPlayPrompt
            ? (platform === 'vimeo' 
                ? '▶️ Tap to play with sound' 
                : '▶️ Tap to play')
            : (autoplayOnScroll 
                ? (platform === 'vimeo' 
                    ? (isMobile ? 'Scroll to see video (tap for sound)' : 'Scroll to autoplay with sound')
                    : 'Scroll to autoplay or click to play')
                : 'Click to play demo'
              )
          }
        </span>
      </div>
    </div>
  );
};

export default YouTubeEmbed; 