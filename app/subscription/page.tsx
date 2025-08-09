import { Metadata } from 'next';
import SubscriptionPage from '../../components/pages/Subscription/SubscriptionPage';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Subscription - Pull-Up Club',
  description: 'Subscribe to Pull-Up Club for just $9.99/month and compete for the $250 weekly prize pool.',
  openGraph: {
    title: 'Join Pull-Up Club - $9.99/month',
    description: 'Subscribe to compete for the $250 weekly prize pool. Prove your strength and earn rewards.',
  },
};

export default function Subscription() {
  return <SubscriptionPage />;
}