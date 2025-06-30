import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle2, Lock, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from 'react-hot-toast';
import PasswordChangeForm from "../../components/Auth/PasswordChangeForm";

const ResetPasswordPage = () => {
  // Debug logging at component load
  console.log('ResetPasswordPage loaded');

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hashVerified, setHashVerified] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { /* removing signIn */ } = useAuth();
  const navigate = useNavigate();

  // Optimized token handling for high-scale usage
  const handleTokensInUrl = useCallback(async () => {
    const searchParams = new URLSearchParams(window.location.search);
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    
    // Early exit if not a recovery request
    if (!accessToken || type !== 'recovery') {
      return;
    }

    console.log('🔐 Processing password reset tokens...');
    
    try {
      // Use both tokens if available, fallback to access token only
      const sessionData = refreshToken 
        ? { access_token: accessToken, refresh_token: refreshToken }
        : { access_token: accessToken, refresh_token: accessToken };

      const { data, error } = await supabase.auth.setSession(sessionData);
      
      if (error) {
        console.error('Session setup failed:', error.message);
        setError('Invalid or expired password reset link. Please request a new one.');
        return;
      }

      if (data.session?.user) {
        console.log('✅ Password reset session established');
        setIsResetMode(true);
        setHashVerified(true);
        setEmail(data.session.user.email || '');
        
        // Clean URL to prevent token reuse (security best practice)
        window.history.replaceState({}, '', '/reset-password');
      }
    } catch (err) {
      console.error('Token processing error:', err);
      setError('Failed to process reset link. Please try again or request a new one.');
      setHashVerified(false);
      setIsResetMode(false);
    }
  }, []);

  // Fixed useEffect dependencies
  useEffect(() => {
    handleTokensInUrl();
  }, [handleTokensInUrl]);

  // Handle password reset request (send email)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Request password reset from Supabase (sends branded email via SMTP)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Password reset instructions sent to your email', {
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#ffffff',
          border: '1px solid #9b9b6f',
        },
        iconTheme: {
          primary: '#9b9b6f',
          secondary: '#ffffff',
        },
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(`Failed to send reset email: ${errorMessage}`);
      toast.error('Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setSuccess(true);
    // Navigate to login - user will need to sign in with new password
    setTimeout(() => navigate("/login"), 1500);
  };

  // Success view
  if (success) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden w-full">
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center">
            <div className="mb-6">
              <img src="/PUClogo-optimized.webp" alt="Pull-Up Club Logo" className="h-16 w-auto" />
            </div>
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Password Updated</h2>
            <p className="text-gray-300 text-center mb-4">
              {email ? "Signing you in automatically..." : "Please sign in with your new password."}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-[#9b9b6f] text-black font-medium px-5 py-3 rounded-full hover:bg-[#7a7a58] transition"
            >
              {email ? "Continue to Profile" : "Sign In"}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Email sent confirmation
  if (emailSent && !isResetMode) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden w-full">
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center">
            <div className="mb-6">
              <img src="/PUClogo-optimized.webp" alt="Pull-Up Club Logo" className="h-16 w-auto" />
            </div>
            <Mail size={48} className="mx-auto text-[#9b9b6f] mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-300 text-center mb-4">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
            <p className="text-gray-400 text-sm text-center mb-6">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                  setError("");
                }}
                className="w-full bg-white/10 text-white font-medium px-5 py-3 rounded-full hover:bg-white/20 transition flex items-center justify-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Try Different Email
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full text-gray-400 hover:text-white text-sm underline"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden w-full">
        <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center">
          <div className="mb-6">
            <img src="/PUClogo-optimized.webp" alt="Pull-Up Club Logo" className="h-16 w-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-[#9b9b6f] mb-6 text-center tracking-wider">
            PULL-UP CLUB
          </h2>
          
          <div className="text-center mb-6">
            {isResetMode ? (
              <>
                <Lock size={28} className="mx-auto text-[#9b9b6f] mb-2" />
                <h3 className="text-xl text-white">Set New Password</h3>
              </>
            ) : (
              <>
                <Mail size={28} className="mx-auto text-[#9b9b6f] mb-2" />
                <h3 className="text-xl text-white">Reset Your Password</h3>
                <p className="text-gray-400 text-sm mt-2">
                  Enter your email and we'll send you reset instructions
                </p>
              </>
            )}
          </div>

          {isResetMode ? (
            !hashVerified ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b9b6f] mx-auto mb-4"></div>
                <p className="text-sm text-white">{error || "Verifying your reset link..."}</p>
              </div>
            ) : (
              <div className="w-full">
                <PasswordChangeForm onSuccess={handlePasswordChangeSuccess} />
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-xs text-gray-400 hover:text-white underline mt-4 text-center w-full"
                >
                  Back to Sign In
                </button>
              </div>
            )
          ) : (
            <form onSubmit={handleRequestReset} className="flex flex-col w-full gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                required
              />
              {error && <div className="text-sm text-red-400">{error}</div>}
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-[#9b9b6f] text-black font-medium px-5 py-3 rounded-full hover:bg-[#7a7a58] transition disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-xs text-gray-400 hover:text-white underline"
              >
                Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;