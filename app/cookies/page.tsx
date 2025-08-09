import React from 'react';
import { Metadata } from 'next';
import CookiesPolicyPage from '../../components/pages/CookiesPolicy/CookiesPolicyPage';

export const metadata: Metadata = {
  title: 'Cookie Policy | Pull-Up Club',
  description: 'Learn about how Pull-Up Club uses cookies and similar technologies.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function Cookies() {
  return <CookiesPolicyPage />;
}