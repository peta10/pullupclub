import { Metadata } from 'next';
import LoginPage from '../../components/pages/Login/LoginPage';
import ProtectedRoute from '../../components/Layout/ProtectedRoute';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Login - Pull-Up Club',
  description: 'Sign in to your Pull-Up Club account to access your profile, submit videos, and track your progress.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function Login() {
  return (
    <ProtectedRoute requireAuth={false}>
      <LoginPage />
    </ProtectedRoute>
  );
}