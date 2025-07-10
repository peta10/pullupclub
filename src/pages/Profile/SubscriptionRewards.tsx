import React, { useState, useEffect } from 'react';
import { CreditCard, Package, Shield, ShoppingBag, DollarSign, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface UserEarning {
  id: string;
  amount_cents: number;
  source: string;
  description: string;
  paid_out: boolean;
  paid_out_date: string | null;
  created_at: string;
  competition_id?: string;
  is_competition_payout?: boolean;
}

interface PayoutRequest {
  id: string;
  amount_cents: number;
  status: string;
  created_at: string;
  processed_at: string | null;
}

interface PatchProgress {
  daysRemaining: number;
  progressPercentage: number;
  currentCycle: number;
}

const SubscriptionRewards: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation('profile');
  const [earnings, setEarnings] = useState<UserEarning[]>([]);
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
    return earnings.reduce((total, earning) => {
      if (!earning.paid_out) {
        return total + earning.amount_cents;
      }
      return total;
    }, 0);
  };

  // Calculate on-hold earnings (competition payouts that can't be withdrawn yet)
  const calculateOnHoldEarnings = () => {
    if (!isEndOfMonth()) {
      return earnings.reduce((total, earning) => {
        if (!earning.paid_out && earning.is_competition_payout) {
          return total + earning.amount_cents;
        }
        return total;
      }, 0);
    }
    return 0;
  };

  // Calculate immediately available earnings (non-competition or end of month)
  const calculateImmediatelyAvailable = () => {
    return calculateAvailableEarnings() - calculateOnHoldEarnings();
  };

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
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
          daysRemaining,
          progressPercentage,
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

      // Fetch user earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from('user_earnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (earningsError) throw earningsError;

      // Fetch payout requests
      const { data: payoutData, error: payoutError } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (payoutError) throw payoutError;

      setEarnings(earningsData || []);
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
    if (!user?.id || isRequestingPayout) return; // Use isRequestingPayout from original state
    
    try {
      setIsRequestingPayout(true);
      
      // Only allow payout of immediately available funds
      const amount = calculateImmediatelyAvailable();
      if (amount <= 0) return;

      const { error } = await supabase.functions.invoke('request-payout', {
        body: { amount_cents: amount }
      });

      if (error) throw error;

      toast.success(t('rewards.payoutSuccess', { 
        amount: formatAmount(amount) 
      }));
      
      // Refresh earnings and payout requests
      await fetchEarnings();
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error(t('common:errors.requestFailed'));
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return (cents / 100).toFixed(2);
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
      return <div>{t('profile:rewards.payouts.loading')}</div>;
    }

    const onHoldAmount = calculateOnHoldEarnings();
    const availableAmount = calculateImmediatelyAvailable();
    const hasPendingRequest = payoutRequests.some(req => req.status === 'pending');

    return (
      <div className="bg-gray-900 p-6 rounded-lg text-center transform transition-transform hover:scale-105">
        <div className="flex justify-center mb-4">
          <DollarSign size={48} className="text-[#9b9b6f]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t('profile:rewards.payouts.title')}</h3>
        <p className="text-gray-400 mb-4">{t('profile:rewards.payouts.subtitle')}</p>

        {onHoldAmount > 0 && (
          <div className="border-l-4 border-yellow-400 pl-3">
            <p className="text-sm text-gray-400">
              {t('profile:rewards.payouts.onHold')}
            </p>
            <p className="text-2xl font-bold text-white mb-1">
              {formatAmount(onHoldAmount)}
            </p>
          </div>
        )}

        {availableAmount > 0 && (
          <div className="border-l-4 border-green-400 pl-3">
            <p className="text-sm text-gray-400">
              {t('rewards.payouts.available')}
            </p>
            <p className="text-2xl font-bold text-white mb-1">
              {formatAmount(availableAmount)}
            </p>
          </div>
        )}

        {availableAmount === 0 && onHoldAmount === 0 && (
          <p className="text-gray-400">
            {t('rewards.payouts.noEarnings')}
          </p>
        )}

        {availableAmount > 0 && !hasPendingRequest && (
          <button
            onClick={handlePayoutRequest}
            disabled={isRequestingPayout || isLoading}
            className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors w-full"
          >
            {isRequestingPayout ? t('rewards.payouts.processing') : 
             availableAmount === 0 ? t('rewards.payouts.noEarnings') : t('rewards.payouts.requestButton')}
          </button>
        )}

        {hasPendingRequest && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded px-4 py-2">
            <span className="text-yellow-400 text-sm font-medium">{t('rewards.payouts.pending')}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* US Shipping Notice */}
      <div className="bg-[#9b9b6f]/10 border border-[#9b9b6f] rounded-lg p-4 text-center">
        <p className="text-[#9b9b6f] text-sm">{t('rewards.shippingNotice')}</p>
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
            <h3 className="text-xl font-bold text-white mb-2">{t('rewards.subscription.title')}</h3>
            <p className="text-gray-400 mb-4">{t('rewards.subscription.subtitle')}</p>
            <a
              href="https://billing.stripe.com/p/login/dRmdR9dos2kmaQcdHGejK00"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              {t('rewards.subscription.button')} <ExternalLink size={16} />
            </a>
          </div>

          {/* Claim Patch */}
          <div className="bg-gray-900 p-6 rounded-lg text-center transform transition-transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <Package size={48} className="text-[#9b9b6f]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('rewards.patch.title')}</h3>
            <p className="text-gray-400 mb-4">{t('rewards.patch.subtitle')}</p>
            <a
              href="https://shop.thebattlebunker.com/checkouts/cn/Z2NwLXVzLWNlbnRyYWwxOjAxSlhCMDJBTkVaOENFOFpTQlM2N1RTM0tR?auto_redirect=false&cart_link_id=MbgRQA7E&discount=PULLUPCLUB100&edge_redirect=true&locale=en-US&skip_shop_pay=true"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#9b9b6f] hover:bg-[#a5a575] text-black font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              {t('rewards.patch.button')} <ExternalLink size={16} />
            </a>
          </div>

          {/* Patch Progress */}
          <div className="bg-gray-900 p-6 rounded-lg text-center transform transition-transform hover:scale-105">
            <div className="flex justify-center mb-4">
              <Shield size={48} className="text-[#9b9b6f]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('rewards.progress.title')}</h3>
            <div className="mb-4">
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div 
                  className="bg-[#9b9b6f] h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${patchProgress.progressPercentage}%` }} 
                />
              </div>
              <p className="text-sm text-gray-400">
                {t('rewards.progress.progress', { percent: patchProgress.progressPercentage })}
              </p>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {t('rewards.progress.remaining', { days: patchProgress.daysRemaining })}
            </p>
            <p className="text-gray-400">
              {t('rewards.progress.untilNext')} (Cycle {patchProgress.currentCycle})
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
            <h3 className="text-xl font-bold text-white mb-2">{t('rewards.gear.title')}</h3>
            <p className="text-gray-400 mb-4">{t('rewards.gear.subtitle')}</p>
            <a
              href="https://shop.thebattlebunker.com/collections/workout-equipment/products/3-pack-battle-bands"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#9b9b6f] hover:bg-[#a5a575] text-black font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              {t('rewards.gear.button')} <ExternalLink size={16} />
            </a>
          </div>

          {/* Payouts */}
          {renderCompetitionPayouts()}
        </div>
      </div>

      {/* Earnings History */}
      {!isLoading && earnings.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">{t('rewards.earningsHistory.title')}</h3>
          <div className="space-y-3">
            {earnings.slice(0, 5).map((earning) => (
              <div key={earning.id} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                <div>
                  <p className="text-white font-medium">{earning.description}</p>
                  <p className="text-gray-400 text-sm capitalize">{earning.source.replace('_', ' ')}</p>
                  <p className="text-gray-500 text-xs">{new Date(earning.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">${formatCurrency(earning.amount_cents)}</p>
                  <span className={`text-xs px-2 py-1 rounded ${earning.paid_out ? 'text-green-400 bg-green-900/20' : 'text-yellow-400 bg-yellow-900/20'}`}>
                    {earning.paid_out ? t('rewards.earningsHistory.paid') : t('rewards.earningsHistory.available')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {earnings.length > 5 && (
            <p className="text-gray-400 text-sm mt-3 text-center">{t('rewards.earningsHistory.andMore', { count: earnings.length - 5 })}</p>
          )}
        </div>
      )}

      {/* Payout Requests History */}
      {!isLoading && payoutRequests.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-4">{t('rewards.payoutHistory.title')}</h3>
          <div className="space-y-3">
            {payoutRequests.slice(0, 3).map((request) => (
              <div key={request.id} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                <div>
                  <p className="text-white font-medium">{t('rewards.payoutHistory.request', { amount: `$${formatCurrency(request.amount_cents)}` })}</p>
                  <p className="text-gray-500 text-xs">{t('rewards.payoutHistory.requestedOn', { date: new Date(request.created_at).toLocaleDateString() })}</p>
                  {request.processed_at && (
                    <p className="text-gray-500 text-xs">{t('rewards.payoutHistory.processedOn', { date: new Date(request.processed_at).toLocaleDateString() })}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(request.status)}`}>{request.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {!isLoading && earnings.length === 0 && (
        <div className="bg-gray-900 p-6 rounded-lg text-center">
          <h3 className="text-xl font-bold text-white mb-2">{t('rewards.noEarnings.title')}</h3>
          <p className="text-gray-400">{t('rewards.noEarnings.description')}</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionRewards; 