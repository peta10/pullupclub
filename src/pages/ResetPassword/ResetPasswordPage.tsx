import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle2, Lock, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hashVerified, setHashVerified] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { updatePassword, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if we have reset tokens in URL
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      setIsResetMode(true);
      verifyResetSession();
    }
  }, [searchParams]);

  // Password validation
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && passwordsMatch;

  const verifyResetSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setError("Invalid or expired password reset link. Please request a new one.");
        return;
      }
      if (data.session?.user) {
        setHashVerified(true);
        if (data.session.user.email) {
          setEmail(data.session.user.email);
        }
      } else {
        setError("You must use the link from your email to reset your password.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

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
      // Step 1: Request password reset from Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Step 2: Send custom branded email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-reset-email', {
        body: { 
          email,
          resetUrl: `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}`
        }
      });

      if (emailError) {
        console.error('Custom email error:', emailError);
      }

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

  // Handle setting new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      setError("Please ensure your password meets all requirements and that both passwords match.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await updatePassword(password);
      setSuccess(true);
      toast.success('Password updated successfully!');

      // Auto sign in after 1.5 seconds
      if (email) {
        setTimeout(async () => {
          try {
            await signIn(email, password);
            navigate("/profile");
          } catch (signInError) {
            console.error("Error signing in after password reset:", signInError);
          }
        }, 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(`Failed to update password: ${errorMessage}`);
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center space-x-2 text-sm">
      <CheckCircle2 size={16} className={met ? "text-green-500" : "text-gray-500"} />
      <span className={met ? "text-green-500" : "text-gray-500"}>{text}</span>
    </div>
  );

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
              <form onSubmit={handleSetNewPassword} className="flex flex-col w-full gap-4">
                <input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
                  required
                />
                <div className="space-y-2 bg-white/5 p-4 rounded-xl">
                  <p className="text-sm font-medium text-gray-300 mb-2">Password Requirements:</p>
                  <PasswordRequirement met={hasMinLength} text="At least 6 characters" />
                  <PasswordRequirement met={hasUpperCase} text="One uppercase letter" />
                  <PasswordRequirement met={hasLowerCase} text="One lowercase letter" />
                  <PasswordRequirement met={hasNumber} text="One number" />
                  <PasswordRequirement met={passwordsMatch} text="Passwords match" />
                </div>
                {error && <div className="text-sm text-red-400">{error}</div>}
                <button
                  type="submit"
                  disabled={!isPasswordValid || isLoading}
                  className="w-full bg-[#9b9b6f] text-black font-medium px-5 py-3 rounded-full hover:bg-[#7a7a58] transition disabled:opacity-50"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Back to Sign In
                </button>
              </form>
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
