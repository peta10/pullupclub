import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useStableTranslation } from "../../../hooks/useStableTranslation";
import { trackConversion } from "../../../utils/meta-pixel";

interface LoginFormProps {
  onShowResetForm: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onShowResetForm,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useStableTranslation('auth');

  // Next.js uses searchParams instead of location.state
  const intendedPlan = searchParams?.get('plan') as "monthly" | "annual" | null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (intendedPlan) {
        localStorage.setItem("pendingSubscriptionPlan", intendedPlan);
      }
      await signIn(email, password);
      
      // Track login event - user will be available from context after successful sign in
      if (user) {
        await trackConversion('Login', {
          external_id: user.id,
          email: user.email
        });
      }
      
      console.log("🔄 Login successful, auth context will handle redirect...");
    } catch (err) {
      localStorage.removeItem("pendingSubscriptionPlan");
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
        
      if (errorMessage.includes("invalid_credentials")) {
        setError(t('errors.invalidCredentials'));
      } else if (errorMessage.includes("email_not_confirmed")) {
        setError(t('errors.emailNotConfirmed'));
      } else if (errorMessage.includes("too_many_attempts")) {
        setError(t('errors.tooManyAttempts'));
      } else {
        setError(t('errors.loginFailed', { message: errorMessage }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToSubscribe = () => {
            router.push('/subscribe');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
      <div className="w-full flex flex-col gap-3">
        <input
          placeholder={t('login.emailLabel')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
          required
        />
        <input
          placeholder={t('login.passwordLabel')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9b9b6f]"
          required
        />

        <div className="text-right">
          <button
            type="button"
            onClick={onShowResetForm}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            {t('login.forgotPassword')}
          </button>
        </div>

        {error && <div className="text-sm text-red-400 text-left">{error}</div>}
      </div>
      <hr className="opacity-10" />
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white/10 text-white font-medium px-5 py-3 rounded-full shadow hover:bg-white/20 transition mb-3 text-sm"
        >
          {isLoading
            ? t('common:status.loading')
            : intendedPlan
            ? t('login.signInAndProceed')
            : t('login.submitButton')}
        </button>

        <div className="w-full text-center mt-2">
          <span className="text-xs text-gray-400">
            {t('login.noAccount')}{" "}
            <button
              type="button"
              onClick={handleGoToSubscribe}
              className="underline text-white/80 hover:text-white"
            >
              {intendedPlan
                ? t('login.signUpAndProceed')
                : t('login.signupLink')}
            </button>
          </span>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;