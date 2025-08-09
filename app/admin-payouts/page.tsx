import { Metadata } from 'next';
import AdminPayoutsPage from '../../components/pages/Admin/AdminPayoutsPage';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Monthly Payouts - Pull-Up Club Admin',
  description: 'Admin interface for managing monthly payouts to Pull-Up Club members.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPayouts() {
  return <AdminPayoutsPage />;
}