import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Button, Card, Input, PasswordInput } from '../../components/ui';
import { PasswordRequirements } from '../../components/Auth/PasswordRequirements';

interface VerificationResult {
  isValid: boolean;
  error?: string;
  customerEmail?: string;
  customerId?: string;
  subscriptionId?: string;
  sessionData?: {
    paymentStatus: string;
    status: string;
    amountTotal: number;
    currency: string;
  };
}

const SignupAccessPage: React.FC = () => {
  const { t } = useTranslation('subscription');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isClaimingPayment, setIsClaimingPayment] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (user) {
      // If user is already logged in, try to claim the payment
      if (sessionId) {
        claimPayment(sessionId);
      } else {
        navigate('/profile');
      }
      return;
    }
    if (!sessionId) {
      navigate('/subscription');
      return;
    }
    verifyStripeSession();
  }, [sessionId, user, navigate]);

  const verifyStripeSession = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-session', {
        body: { sessionId }
      });
      if (error) {
        console.error('Error verifying session:', error);
        setVerificationStatus('invalid');
        setVerificationResult({ isValid: false, error: 'Failed to verify payment session' });
        return;
      }
      if (data.success && data.isValid) {
        setVerificationStatus('valid');
        setVerificationResult(data);
        if (data.customerEmail) {
          setFormData(prev => ({ ...prev, email: data.customerEmail }));
        }
      } else {
        setVerificationStatus('invalid');
        setVerificationResult({ isValid: false, error: 'Payment session is not valid or expired' });
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      setVerificationStatus('invalid');
      setVerificationResult({ isValid: false, error: 'Failed to verify payment session' });
    }
  };

  const claimPayment = async (sessionId: string) => {
    setIsClaimingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('claim-payment', {
        body: { sessionId }
      });

      if (error) {
        console.error('Error claiming payment:', error);
        toast.error('Failed to claim payment. Please contact support.');
        return;
      }

      if (data.success) {
        toast.success('Payment claimed successfully!');
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error in payment claiming:', error);
      toast.error('Failed to claim payment. Please contact support.');
    } finally {
      setIsClaimingPayment(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingAccount(true);
    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error(t('common:errors.passwordMismatch'));
        return;
      }
      if (!isPasswordValid) {
        toast.error(t('common:errors.passwordRequirementsNotMet'));
        return;
      }
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            stripe_customer_id: verificationResult?.customerId,
            is_paid: true
          }
        }
      });
      if (authError) {
        console.error('Error creating account:', authError);
        toast.error(`Failed to create account: ${authError.message}`);
        return;
      }
      toast.success(t('common:status.success'));
      // The payment will be claimed automatically when the user is logged in
      // due to the useEffect hook above
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error(t('common:errors.generic'));
    } finally {
      setIsCreatingAccount(false);
    }
  };

  // Password validation logic
  const hasMinLength = formData.password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasLowerCase = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && passwordsMatch;

  if (verificationStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold">Verifying Payment...</h2>
            <p className="text-gray-600">Please wait while we verify your payment session.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold text-red-600">Payment Verification Failed</h2>
            <p className="text-gray-600">{verificationResult?.error || 'Invalid or expired payment session'}</p>
            <Button
              className="mt-4"
              onClick={() => navigate('/subscription')}
            >
              Return to Subscription Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (isClaimingPayment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="mb-4 text-xl font-semibold">Claiming Payment...</h2>
            <p className="text-gray-600">Please wait while we set up your subscription.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md p-6">
        <h2 className="mb-6 text-center text-2xl font-bold">Complete Your Account Setup</h2>
        <form onSubmit={handleCreateAccount}>
          <div className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!!verificationResult?.customerEmail}
              required
            />
            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
            <PasswordRequirements
              password={formData.password}
              confirmPassword={formData.confirmPassword}
            />
          </div>
          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={isCreatingAccount || !isPasswordValid}
          >
            {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default SignupAccessPage; 