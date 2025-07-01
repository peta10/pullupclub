import React, { useState, useEffect, useRef, memo } from 'react';
import { Button } from '../../components/ui/Button';
import { Link } from '../../components/ui/Link';
import { Zap } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

// Use the same color and font conventions as Hero.tsx
// const FALLBACK_ACTIVE_USERS = 1230

// Lazy load non-critical features
const LazyActivityTicker = memo(() => {
  const { t } = useTranslation('home');
  const [recentActivity, setRecentActivity] = useState([
    { name: "Marcus", location: "Chicago", pullUps: 25, time: "2 min ago" }
  ]);

  const cityNameMap: { [key: string]: string[] } = {
    "Chicago": ["Marcus", "Emily", "James"],
    "London": ["Sarah", "Oliver", "Amelia"],
    "São Paulo": ["Carlos", "Ana", "Lucas"],
    "Tokyo": ["Yuki", "Haruto", "Sakura"],
    "Berlin": ["Lukas", "Mia", "Leon"],
    "Sydney": ["Oliver", "Charlotte", "Jack"]
  };
  const cities = Object.keys(cityNameMap);

  useEffect(() => {
    const interval = setInterval(() => {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const names = cityNameMap[city];
      const name = names[Math.floor(Math.random() * names.length)];
      setRecentActivity([{
        name,
        location: city,
        pullUps: Math.floor(Math.random() * 40) + 10,
        time: t('hero.justNow')
      }]);
    }, 8000);
    return () => clearInterval(interval);
  }, [t]);

  return (
    <div className="absolute top-4 left-0 right-0 z-10">
      <div className="max-w-7xl mx-auto px-2 py-2">
        <div className="flex items-center text-sm">
          <div className="flex items-center space-x-2 mr-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400">{t('hero.live')}</span>
          </div>
          <span className="text-gray-300">
            <Trans
              i18nKey="hero.liveActivity"
              t={t}
              values={{
                name: recentActivity[0].name,
                location: recentActivity[0].location,
                pullUps: recentActivity[0].pullUps,
              }}
              components={[
                <span className="text-[#9b9b6f] font-semibold" />,
                <span className="text-[#9b9b6f]" />,
              ]}
            />
          </span>
        </div>
      </div>
    </div>
  );
});

const Hero1: React.FC = () => {
  const { t } = useTranslation('home');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [displayedActiveUsers, setDisplayedActiveUsers] = useState(0);
  const [currentPullUps] = useState(368);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [headlineVisible, setHeadlineVisible] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);

  // Map of cities to typical names (for future use)
  // const cityNameMap: Record<string, string[]> = {
  //   "Chicago": ["Marcus", "Emily", "James", "Ashley"],
  //   "London": ["Sarah", "Oliver", "Amelia", "Jack"],
  //   "São Paulo": ["Carlos", "Ana", "Lucas", "Beatriz"],
  //   "Tokyo": ["Yuki", "Haruto", "Sakura", "Ren"],
  //   "Berlin": ["Lukas", "Mia", "Leon", "Hannah"],
  //   "Sydney": ["Oliver", "Charlotte", "Jack", "Isla"],
  //   "Toronto": ["Liam", "Emma", "Noah", "Olivia"],
  //   "Mumbai": ["Aarav", "Priya", "Vivaan", "Ananya"],
  //   "Lagos": ["Chinedu", "Ngozi", "Emeka", "Amina"],
  //   "Paris": ["Louis", "Camille", "Lucas", "Chloé"],
  //   "Madrid": ["Mateo", "Lucía", "Sofía", "Hugo"],
  //   "New York": ["Michael", "Jessica", "David", "Ashley"],
  // };

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setTimeout(() => setAnimationsEnabled(true), 300);
          setTimeout(() => setHeadlineVisible(true), 400);
          setTimeout(() => setSubtitleVisible(true), 900);
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Preload appropriate hero image based on screen size
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = 'image/webp';
    
    if (window.innerWidth <= 768) {
      link.href = '/pullup_header-mobile.webp';
    } else if (window.innerWidth <= 1024) {
      link.href = '/pullup_header-tablet.webp';
    } else {
      link.href = '/pullup_header_desktop.webp';
    }
    
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Animated counter for pull-ups and active users
  useEffect(() => {
    if (animationsEnabled) {
      // Animation effect for visual feedback (stats animation removed for now)
      // Could be used for future stat animations
    }
  }, [animationsEnabled]);

  // Slower, smooth animated counter for Warriors Joined
  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const end = 27;
      const duration = 1800; // ms, slower
      const stepTime = 30;
      const steps = Math.ceil(duration / stepTime);
      const increment = Math.max(1, Math.round((end - start) / steps));
      let current = start;
      setDisplayedActiveUsers(start);
      const interval = setInterval(() => {
        current += increment;
        if (current >= end) {
          setDisplayedActiveUsers(end);
          clearInterval(interval);
        } else {
          setDisplayedActiveUsers(current);
        }
      }, stepTime);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  return (
    <div ref={heroRef} className="relative bg-gray-900 text-white overflow-hidden" style={{ minHeight: '70vh' }}>
      {/* Background image with overlay */}
      <div className="absolute inset-0 bg-black">
        <picture>
          <source 
            media="(max-width: 768px)"
            srcSet="/pullup_header-mobile.webp"
            type="image/webp"
          />
          <source 
            media="(max-width: 1024px)"
            srcSet="/pullup_header-tablet.webp"
            type="image/webp"
          />
          <source 
            srcSet="/pullup_header_desktop.webp"
            type="image/webp"
          />
          <img
            src="/pullup_header_desktop.webp"
            alt={t('hero.alt_athlete')}
            className={`w-full h-full object-cover object-center md:object-right-center transition-opacity duration-1000 ${imageLoaded ? 'opacity-50' : 'opacity-0'}`}
            style={{ objectPosition: '60% center' }}
            loading="eager"
            onLoad={() => setImageLoaded(true)}
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent opacity-85"></div>
      </div>

      {/* Lazy load activity ticker */}
      <LazyActivityTicker />

      <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 flex flex-col items-start justify-center" style={{ minHeight: '70vh' }}>
        {/* Animated Warriors Joined Counter */}
        <div className={`mb-2 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <span className="block text-2xl md:text-3xl font-bold tracking-tight text-white">
            {displayedActiveUsers.toLocaleString()}+ <span className="text-[#9b9b6f]">{t('hero.warriorsJoined')}</span>
          </span>
        </div>
        {/* Dramatic Headline Animation */}
        <div className={`mb-2 transition-all duration-700 ${headlineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="block text-[#9b9b6f]">
              {t('hero.title')}
            </span>
          </h1>
        </div>
        {/* Dramatic Subtitle Animation */}
        <div className={`transition-all duration-700 ${subtitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="mt-4 text-xl text-gray-300 max-w-3xl">
            {t('hero.subtitle')}
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Button size="lg" className="bg-[#a5a676] hover:bg-[#8f8f66] text-white rounded-full px-8 py-3">
            <Link href="/subscription" className="text-white">
              {t('hero.cta')}
            </Link>
          </Button>
          <Button variant="secondary" size="lg" className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-full px-8 py-3">
            <Link href="/leaderboard" className="text-white">
              {t('hero.secondaryCta')}
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          <div className="flex flex-col">
            <span className="text-3xl sm:text-4xl font-bold text-[#9b9b6f]">{t('hero.price')}</span>
            <span className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400">{t('hero.cancelAnytime')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl sm:text-4xl font-bold text-[#9b9b6f]">{t('hero.global')}</span>
            <span className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400">{t('hero.leaderboard')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl sm:text-4xl font-bold text-[#9b9b6f]">5</span>
            <span className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400">{t('hero.badgeTypes')}</span>
          </div>
        </div>

        <div className="mt-8 flex items-center space-x-4 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#9b9b6f]" />
            <span>
              <Trans
                i18nKey="hero.pullUpsToday"
                t={t}
                values={{ count: currentPullUps }}
                components={[<span className="text-[#9b9b6f] font-bold" />]}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Hero1); 