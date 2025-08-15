'use client'

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "../../Layout/Layout";
import { useAuth } from "../../../context/AuthContext";
import { getActiveSubscription } from "../../../lib/stripe";
import { CheckCircle2, Loader2 } from "lucide-react";
import SubscriptionDetails from "./SubscriptionDetails";
import SubscriptionPlans from "./SubscriptionPlans";
import PaymentHistory from "./PaymentHistory";
import { useSearchParams, useRouter } from "next/navigation";
import CheckoutSuccess from "./CheckoutSuccess";
import StripePaymentForm from "./StripePaymentForm";
import { supabase } from "../../../lib/supabase";
import { useStableTranslation } from '../../../hooks/useStableTranslation';
import { Trans } from 'react-i18next';
import Image from 'next/image';

const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, ready } = useStableTranslation('subscription');
  
  const successParam = searchParams?.get("success");
  const cancelledParam = searchParams?.get("cancelled");
  const planParam = searchParams?.get("plan") as "monthly" | "annual" | null;
  // For checkout success
  const checkoutParam = searchParams?.get("checkout");

  // Check if the user has a subscription when the component mounts or when the user changes
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setHasSubscription(false);
        setIsLoading(false);
        return;
      }

      try {
        // Helper to obtain a valid session, retrying briefly if needed
        const obtainSession = async (retries = 3, delayMs = 500) => {
          for (let i = 0; i < retries; i++) {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (session && !error) return session;
            // Wait before retrying
            await new Promise((res) => setTimeout(res, delayMs));
          }
          return null;
        };

        // Make sure we have a valid session before checking subscription
        const session = await obtainSession();
        if (!session) {
          console.log("No authenticated session available for subscription check - user not logged in");
          setHasSubscription(false);
          setIsLoading(false);
          return;
        }

        const data = await getActiveSubscription();
        
        // Safely handle null data
        if (!data) {
          console.warn("No subscription data returned");
          setHasSubscription(false);
        } else {
          setHasSubscription(!!data.subscription);
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
        setError("Failed to load subscription status");
        setHasSubscription(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  // Set up the payment form if the user comes with intendedAction=subscribe
  // useEffect(() => {
  //   // If user has returned from login/signup and wants to subscribe
  //   if (user && routeState?.intendedAction === "subscribe" && routeState?.plan) {
  //     setShowPaymentForm(true);
  //   }
  // }, [user]);

  // Show success page if redirected from successful checkout
  if (successParam === "true" || checkoutParam === "completed") {
    return (
      <Layout>
        <Head>
          <title>{t('meta.title', 'Subscription | Pull-Up Club')}</title>
          <meta name='description' content={t('meta.description', 'Choose your subscription plan and join the Pull-Up Club today. Monthly and annual plans available.')} />
        </Head>
        <div className="bg-black min-h-screen py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <CheckoutSuccess 
              subscriptionType={planParam || "monthly"}
              customerName={user?.email?.split('@')[0]}
              redirectTo="/profile"
              redirectLabel="Go to your profile"
            />
          </div>
        </div>
      </Layout>
    );
  }

  // If user explicitly came to subscribe with the standard checkout flow
  if (showPaymentForm && !hasSubscription && user) {
    return (
      <Layout>
        <Head>
          <title>{t('meta.title', 'Subscription | Pull-Up Club')}</title>
          <meta name='description' content={t('meta.description', 'Choose your subscription plan and join the Pull-Up Club today. Monthly and annual plans available.')} />
        </Head>
        <div className="bg-black min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
          <div className="w-full max-w-lg">
            <h1 className="text-2xl font-bold text-white mb-6 text-center">
              {t('completeSubscriptionTitle')}
            </h1>
            <StripePaymentForm
              onPaymentComplete={() => {
                // When payment succeeds show the success component
                router.push("/subscription?success=true&plan=monthly");
              }}
              onPaymentError={(msg) => {
                // stay on page, maybe show toast (handled in component)
                console.error("Payment error", msg);
              }}
            />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{t('meta.title', 'Subscription | Pull-Up Club')}</title>
        <meta name='description' content={t('meta.description', 'Choose your subscription plan and join the Pull-Up Club today. Monthly and annual plans available.')} />
      </Head>
      <div className="bg-black min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-3 gap-2 sm:gap-4">
              <Image
                src="/PUClogo (1).webp"
                alt="Pull-Up Club Logo"
                width={64}
                height={64}
                className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 object-contain inline-block"
                style={{ background: 'transparent' }}
                priority
              />
              <h1 className="text-xl sm:text-3xl font-bold text-white m-0 p-0">
                {t('title', 'Pull-Up Club Membership')}
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('subtitle', 'Join our exclusive pull-up challenge community, track your progress, and compete on the leaderboard.')}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-10 w-10 text-[#9b9b6f] animate-spin" />
            </div>
          ) : hasSubscription ? (
            <div className="space-y-8 max-w-3xl mx-auto">
              {cancelledParam === "true" && (
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-8 flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                  <p className="text-yellow-200">
                    {t('cancellationNotice')}
                  </p>
                </div>
              )}

              <div className="bg-[#9b9b6f]/20 border border-[#9b9b6f] rounded-lg p-4 mb-8 flex items-center">
                <CheckCircle2 className="h-5 w-5 text-[#9b9b6f] mr-2 flex-shrink-0" />
                <p className="text-gray-200">
                  {t('activeNotice')}
                </p>
              </div>
              
              <SubscriptionDetails />
              
              <PaymentHistory />
            </div>
          ) : (
            <>
              <SubscriptionPlans />
              
              <div className="mt-12 text-center text-sm text-gray-500">
                <p>
                  <Trans
                    i18nKey="agreement"
                    t={t}
                    defaults="By subscribing, you agree to our <0>Terms of Service</0> and <1>Privacy Policy</1>."
                    components={[
                      <a key="terms-link" href="/terms" className="text-[#9b9b6f] hover:underline" />,
                      <a key="privacy-link" href="/privacy" className="text-[#9b9b6f] hover:underline" />
                    ]}
                  />
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="max-w-2xl mx-auto mt-8 bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm text-red-200 text-center">
              {error === "Failed to load subscription status" ? t('loadingStatus') : error}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage;