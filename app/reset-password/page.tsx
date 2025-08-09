import React from 'react';
import { Metadata } from 'next';
import ResetPasswordPage from '../../components/pages/ResetPassword/ResetPasswordPage';

export const metadata: Metadata = {
  title: 'Reset Password | Pull-Up Club',
  description: 'Reset your Pull-Up Club account password.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function ResetPassword() {
  return <ResetPasswordPage />;
}