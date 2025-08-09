import { Metadata } from 'next';
import ProfilePage from '../../components/pages/Profile/ProfilePage';
import ProtectedRoute from '../../components/Layout/ProtectedRoute';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Profile - Pull-Up Club',
  description: 'Manage your Pull-Up Club profile, view submissions, and track your progress.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function Profile() {
  return (
    <ProtectedRoute requireAuth={true}>
      <ProfilePage />
    </ProtectedRoute>
  );
}