import React, { useState, useEffect } from 'react';
import { CreditCard, Package, Shield, ShoppingBag, DollarSign, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface WeeklyEarning {
  id: string;
  earning_amount_dollars: number;
  pull_up_count: number;
  is_first_submission: boolean;
  created_at: string;
  weekly_pool_id: string;
}

interface PayoutRequest {
  id: string;
  amount_dollars: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  request_date: string;
  processed_date: string | null;
  notes: string | null;
}

interface PatchProgress {
  daysRemaining: number;
  progressPercentage: number;
  currentCycle: number;
}

const SubscriptionRewards: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation('profile');
  const [weeklyEarnings, setWeeklyEarnings] = useState<WeeklyEarning[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patchProgress, setPatchProgress] = useState<PatchProgress>({
    daysRemaining: 90,
    progressPercentage: 0,
    currentCycle: 1
  });

  // Function to check if we're at the end of the month
  const isEndOfMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return now.getDate() >= lastDay - 2; // Allow requests 2 days before month end
  };

  // Calculate total available earnings (not paid out)
  const calculateAvailableEarnings = () => {
    return weeklyEarnings.reduce((total, earning) => {
      return total + earning.earning_amount_dollars;
    }, 0);
  };

  // Calculate on-hold earnings (competition payouts that can't be withdrawn yet)
  const calculateOnHoldEarnings = () => {
    if (!isEndOfMonth()) {
      // All earnings are on hold until end of month
      return calculateAvailableEarnings();
    }
    return 0;
  };

  // Calculate immediately available earnings (end of month only)
  const calculateImmediatelyAvailable = () => {
    const totalEarned = calculateAvailableEarnings();
    const totalRequestedOrPaid = payoutRequests.reduce((total, request) => {
      if (request.status === 'paid' || request.status === 'approved' || request.status === 'pending') {
        return total + request.amount_dollars;
      }
      return total;
    }, 0);
    
    const available = totalEarned - totalRequestedOrPaid;
    return isEndOfMonth() ? Math.max(0, available) : 0;
  };

  const formatAmount = (dollars: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(dollars);
  };

  const calculatePatchProgress = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.created_at) {
        const signupDate = new Date(data.created_at);
        const daysSinceSignup = Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentCycle = Math.floor(daysSinceSignup / 90) + 1;
        const daysInCurrentCycle = daysSinceSignup - ((currentCycle - 1) * 90);
        const daysRemaining = 90 - daysInCurrentCycle;
        const progressPercentage = Math.round((daysInCurrentCycle / 90) * 100);

        setPatchProgress({
          daysRemaining: Math.max(0, daysRemaining),
          progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
          currentCycle
        });
      }
    } catch (err) {
      console.error('Error calculating patch progress:', err);
      // Don't show this error to the user as it's not critical
    }
  };

  const fetchEarnings = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Fetch weekly earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('weekly_earnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (earningsError) throw earningsError;

      // Fetch payout requests
      const { data: payoutData, error: payoutError } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('request_date', { ascending: false });

      if (payoutError) throw payoutError;

      setWeeklyEarnings(earningsData || []);
      setPayoutRequests(payoutData || []);
      
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
    calculatePatchProgress();
  }, [user?.id]);

  const handlePayoutRequest = async () => {
    if (!user?.id || isRequestingPayout) return;
    
    try {
      setIsRequestingPayout(true);
      
      // Only allow payout of immediately available funds
      const amount = calculateImmediatelyAvailable();
      if (amount <= 0) {
        toast.error('No funds available for payout at this time');
        return;
      }

      // Call the edge function to create payout request
      const { error } = await supabase.functions.invoke('request-payout', {
        body: { amount_dollars: amount }
      });

      if (error) throw error;

      toast.success(`Payout request submitted: ${formatAmount(amount)}`);
      
      // Refresh earnings and payout requests
      await fetchEarnings();
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to submit payout request. Please try again.');
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-900/20';
      case 'approved': return 'text-green-400 bg-green-900/20';
      case 'paid': return 'text-blue-400 bg-blue-900/20';
      case 'rejected': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  // Render competition payouts box
  const renderCompetitionPayouts = () => {
    if (isLoading) {
      return <div className="animate-pulse">Loading payouts...</div>;
    }

    const onHoldAmount = calculateOnHoldEarnings();
    const availableAmount = calculateImmediatelyAvailable();
    const totalEarned = calculateAvailableEarnings();
    const hasPendingRequest = payoutRequests.some(req => req.status === 'pending');

    return (
      <div className="bg-gray-900 p-6 rounded-lg text-center transform transition-transform hover:scale-105">
        <div className="flex justify-center mb-4">
          <DollarSign size={48} className="text-[#9b9b6f]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Competition Payouts</h3>
        <p className="text-gray-400 mb-4">Monthly earnings from pull-up competitions</p>

        <div className="space-y-3 mb-4">
          <div className="bg-gray-800 p-3 rounded">
            <p className="text-sm text-gray-400">Total Earned</p>
            <p className="text-xl font-bold text-white">
              {formatAmount(totalEarned)}
            </p>
          </div>

          {onHoldAmount > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-600 p-3 rounded">
              <p className="text-sm text-yellow-400">On Hold Until Month End</p>
              <p className="text-lg font-bold text-yellow-300">
                {formatAmount(onHoldAmount)}
              </p>
            </div>
          )}

          {availableAmount > 0 && (
            <div className="bg-green-900/20 border border-green-600 p-3 rounded">
              <p className="text-sm text-green-400">Available for Payout</p>
              <p className="text-lg font-bold text-green-300">
                {formatAmount(availableAmount)}
              </p>
            </div>
          )}
        </div>

        {!isEndOfMonth() && totalEarned > 0 && (
          <div className="bg-blue-900/20 border border-blue-600 p-3 rounded mb-4">
            <p className="text-blue-300 text-sm">
              💡 Payouts are available at the end of each month
            </p>
          </div>
        )}

        {availableAmount > 0 && !hasPendingRequest && (
          <button
            onClick={handlePayoutRequest}
            disabled={isRequestingPayout || isLoading}
            className="bg-[#9b9b6f] hover:bg-[#a5a575] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-2 px-4 rounded-lg transition-colors w-full"
          >
            {isRequestingPayout ? 'Processing...' : `Request Payout (${formatAmount(availableAmount)})`}
          </button>
        )}

        {hasPendingRequest && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded px-4 py-2">
            <span className="text-yellow-400 text-sm font-medium">Payout request pending</span>
          </div>
        )}

        {totalEarned === 0 && (
          <p className="text-gray-400">
            Start competing to earn money from pull-up challenges!
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* US Shipping Notice */}
      <div className="bg-[#9b9b6f]/10 border border-[#9b9b6f] rounded-lg p-4 text-center">
        <p className="text-[#9b9b6f] text-sm">
          US shipping only. International users are not currently eligible for patch or physical rewards.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Top Row - 3 boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Subscription & Rewards */}
          <div className="bg-gray-900 p-6 rounded-lg text-center transform transition-transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <CreditCard size={48} className="text-[#9b9b6f]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Subscription</h3>
            <p className="text-gray-400 mb-4">Manage your monthly subscription</p>
            <a
              href="https://billing.stripe.com/p/login/dRmdR9dos2kmaQcdHGejK00"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              Manage Subscription <ExternalLink size={16} />
            </a>
          </div>

          {/* Claim Patch */}
          <div className="bg-gray-900 p-6 rounded-lg text-center transform transition-transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <Package size={48} className="text-[#9b9b6f]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Claim Your Patch</h3>
            <p className="text-gray-400 mb-4">Get your earned patch</p>
            <a
              href="https://shop.thebattlebunker.com/checkouts/cn/Z2NwLXVzLWNlbnRyYWwxOjAxSlhCMDJBTkVaOENFOFpTQlM2N1RTM0tR?auto_redirect=false&cart_link_id=MbgRQA7E&discount=PULLUPCLUB100&edge_redirect=true&locale=en-US&skip_shop_pay=true"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#9b9b6f] hover:bg-[#a5a575] text-black font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              Claim Patch <ExternalLink size={16} />
            </a>
          </div>

          {/* Patch Progress */}
          <div className="bg-gray-900 p-6 rounded-lg text-center transform transition-transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <Shield size={48} className="text-[#9b9b6f]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Next Patch Progress</h3>
            <div className="mb-4">
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div 
                  className="bg-[#9b9b6f] h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${patchProgress.progressPercentage}%` }} 
                />
              </div>
              <p className="text-sm text-gray-400">
                Progress: {patchProgress.progressPercentage}%
              </p>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {patchProgress.daysRemaining} days
            </p>
            <p className="text-gray-400">
              until your next patch ships (Cycle {patchProgress.currentCycle})
            </p>
          </div>
        </div>

        {/* Bottom Row - 2 boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:w-2/3 mx-auto">
          {/* Shop Gear */}
          <div className="bg-gray-900 p-6 rounded-lg text-center transform transition-transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <ShoppingBag size={48} className="text-[#9b9b6f]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Shop Gear</h3>
            <p className="text-gray-400 mb-4">Get your training equipment</p>
            <a
              href="https://shop.thebattlebunker.com/collections/workout-equipment/products/3-pack-battle-bands"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#9b9b6f] hover:bg-[#a5a575] text-black font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              Shop Gear <ExternalLink size={16} />
            </a>
          </div>

          {/* Payouts */}
          {renderCompetitionPayouts()}
        </div>
      </div>

      {/* Earnings History */}
      {!isLoading && weeklyEarnings.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Earnings History</h3>
          <div className="space-y-3">
            {weeklyEarnings.slice(0, 5).map((earning) => (
              <div key={earning.id} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                <div>
                  <p className="text-white font-medium">
                    {earning.pull_up_count} pull-ups{earning.is_first_submission ? ' (First submission bonus)' : ''}
                  </p>
                  <p className="text-gray-400 text-sm">Competition earning</p>
                  <p className="text-gray-500 text-xs">{new Date(earning.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{formatAmount(earning.earning_amount_dollars)}</p>
                  <span className="text-xs px-2 py-1 rounded text-yellow-400 bg-yellow-900/20">
                    {isEndOfMonth() ? 'Available' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {weeklyEarnings.length > 5 && (
            <p className="text-gray-400 text-sm mt-3 text-center">
              ...and {weeklyEarnings.length - 5} more earnings
            </p>
          )}
        </div>
      )}

      {/* Payout Requests History */}
      {!isLoading && payoutRequests.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">Payout History</h3>
          <div className="space-y-3">
            {payoutRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                <div>
                  <p className="text-white font-medium">Payout Request: {formatAmount(request.amount_dollars)}</p>
                  <p className="text-gray-500 text-xs">Requested: {new Date(request.request_date).toLocaleDateString()}</p>
                  {request.processed_date && (
                    <p className="text-gray-500 text-xs">Processed: {new Date(request.processed_date).toLocaleDateString()}</p>
                  )}
                  {request.notes && (
                    <p className="text-gray-400 text-xs mt-1">{request.notes}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {!isLoading && weeklyEarnings.length === 0 && (
        <div className="bg-gray-900 p-6 rounded-lg text-center">
          <h3 className="text-xl font-bold text-white mb-2">No Earnings Yet</h3>
          <p className="text-gray-400">Start participating in pull-up competitions to earn money!</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionRewards;