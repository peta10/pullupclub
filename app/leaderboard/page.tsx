import { Metadata } from 'next';
import LeaderboardPage from '../../components/pages/Leaderboard/LeaderboardPage';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Leaderboard - Pull-Up Club',
  description: 'View the current leaderboard rankings, see top performers, and track competition results.',
  openGraph: {
    title: 'Pull-Up Club Leaderboard',
    description: 'See who\'s leading the pull-up competition this month.',
  },
};

export default function Leaderboard() {
  return <LeaderboardPage />;
}