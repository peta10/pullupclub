import React from 'react';
import { Metadata } from 'next';
import SuccessPage from '../../components/pages/Success/SuccessPage';

export const metadata: Metadata = {
  title: 'Success | Pull-Up Club',
  description: 'Thank you for joining the Pull-Up Club! Your submission has been received.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function Success() {
  return <SuccessPage />;
}