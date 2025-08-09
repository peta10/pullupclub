import { Metadata } from 'next';
import VideoSubmissionPage from '../../components/pages/VideoSubmission/VideoSubmissionPage';
import ProtectedRoute from '../../components/Layout/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Submit Video - Pull-Up Club',
  description: 'Submit your pull-up video for this month\'s competition. Show your strength and compete for the prize pool.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function Submit() {
  return (
    <ProtectedRoute requireAuth={true}>
      <VideoSubmissionPage />
    </ProtectedRoute>
  );
}