'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminDashboardPage from '../../components/pages/Admin/AdminDashboardPage';

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      router.replace('/login');
    }
  }, [user, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9b9b6f]"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <AdminDashboardPage />;
}