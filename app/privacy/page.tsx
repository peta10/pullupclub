import React from 'react';
import { Metadata } from 'next';
import PrivacyPolicyPage from '../../components/pages/PrivacyPolicy/PrivacyPolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | Pull-Up Club',
  description: 'Read our privacy policy to understand how we collect, use, and protect your personal information.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function Privacy() {
  return <PrivacyPolicyPage />;
}