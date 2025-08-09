'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { User, Menu, X, Trophy, Home, UserPlus, LogIn, LogOut, Shield } from 'lucide-react';
import { useStableTranslation } from '../../hooks/useStableTranslation';
import { LanguageSelector } from '../LanguageSelector';
import { useLenis } from '../../hooks/useLenis';

const Header: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useStableTranslation('common');
  const { scrollToTop } = useLenis();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-black text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-[#9b9b6f] hover:text-[#7a7a58] transition-colors"
            onClick={(e) => {
              // If already on home page, smooth scroll to top
              if (window.location.pathname === '/') {
                e.preventDefault()
                scrollToTop()
              }
            }}
          >
            <Image 
              src="/battlebunker-logo-optimized.webp"
              alt="Battle Bunker Logo"
              width={150}
              height={40}
              className="h-10 w-auto mr-3"
              quality={100}
              priority={true}
              unoptimized={false}
            />
            <span className="text-xl font-bold tracking-wider"></span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
            <Link href="/leaderboard" className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center">
              <Trophy className="h-4 w-4 mr-1" />
              Leaderboard
            </Link>
            <Link href="/ethos" className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12a2 2 0 002 2h8V4H6a2 2 0 00-2 2z" /></svg>
              Ethos
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="flex items-center space-x-2 font-medium hover:text-[#9b9b6f] transition-colors">
                  <User size={20} />
                  <span>Profile</span>
                </Link>
                {isAdmin && (
                  <Link href="/admin-dashboard" className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Admin Dashboard
                  </Link>
                )}
                <button
                  className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center bg-transparent border-none outline-none cursor-pointer p-0"
                  onClick={signOut}
                  type="button"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/subscription" className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Sign Up
                </Link>
                <Link href="/login" className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center">
                  <LogIn className="h-4 w-4 mr-1" />
                  Login
                </Link>
              </>
            )}
            <LanguageSelector />
          </nav>
          
          <button 
            className="md:hidden text-white focus:outline-none" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-black border-t border-gray-800 shadow-lg">
            <nav className="flex flex-col space-y-4 p-4">
              <Link 
                href="/" 
                className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
              <Link 
                href="/leaderboard" 
                className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Trophy className="h-4 w-4 mr-1" />
                Leaderboard
              </Link>
              <Link 
                href="/ethos" 
                className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12a2 2 0 002 2h8V4H6a2 2 0 00-2 2z" /></svg>
                Ethos
              </Link>
              {user ? (
                <>
                  <Link 
                    href="/profile" 
                    className="flex items-center space-x-2 font-medium hover:text-[#9b9b6f] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  {isAdmin && (
                    <Link 
                      href="/admin-dashboard" 
                      className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center bg-transparent border-none outline-none cursor-pointer p-0"
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    type="button"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/subscription" 
                    className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Sign Up
                  </Link>
                  <Link 
                    href="/login" 
                    className="font-medium hover:text-[#9b9b6f] transition-colors flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="h-4 w-4 mr-1" />
                    Login
                  </Link>
                </>
              )}
              <LanguageSelector />
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;