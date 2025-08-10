import { Metadata } from 'next';
import SignupAccessPage from '../../components/pages/Subscription/SignupAccessPage';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Complete Your Signup - Pull-Up Club',
  description: 'Complete your account setup after payment.',
};

export default function SignupAccess() {
  return <SignupAccessPage />;
}
