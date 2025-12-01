import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ROUTES } from '../constants';
import { signUp, signIn, resetPassword, getAuthErrorMessage } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeString, sanitizeEmail } from '../utils/sanitize';
import authBg from '../assets/images/place (9).jpg';

interface AuthFormData {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  confirmPassword?: string;
  general?: string;
}

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isLogin = location.pathname === ROUTES.LOGIN;
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  if (user) {
    navigate(ROUTES.HOME, { replace: true });
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!formData.name?.trim()) {
        newErrors.name = 'Full name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Sanitize inputs before sending
      const sanitizedEmail = sanitizeEmail(formData.email.trim());
      // Note: Password is not sanitized to preserve special characters
      const sanitizedPassword = formData.password.trim();
      
      if (isLogin) {
        // Sign in
        const { user, session, error } = await signIn({
          email: sanitizedEmail,
          password: sanitizedPassword,
          rememberMe,
        });

        if (error) {
          setErrors({ general: getAuthErrorMessage(error) });
          return;
        }

        if (user && session) {
          // Redirect to the page user was trying to access, or home
          const from = (location.state as { from?: Location })?.from?.pathname || ROUTES.HOME;
          navigate(from, { replace: true });
        }
      } else {
        // Sign up
        const sanitizedName = formData.name ? sanitizeString(formData.name.trim()) : '';
        const { user, error } = await signUp({
          email: sanitizedEmail,
          password: sanitizedPassword,
          fullName: sanitizedName,
        });

        if (error) {
          setErrors({ general: getAuthErrorMessage(error) });
          return;
        }

        if (user) {
          // Show success message and redirect to login or show email verification message
          if (user.email_confirmed_at) {
            // Email already confirmed (shouldn't happen normally)
            navigate(ROUTES.LOGIN, { replace: true });
          } else {
            // Show email verification message
            setResetEmailSent(true);
            setTimeout(() => {
              navigate(ROUTES.LOGIN, { replace: true });
            }, 3000);
          }
        }
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Sanitize email before sending
      const sanitizedEmail = sanitizeEmail(formData.email.trim());
      const { error } = await resetPassword(sanitizedEmail);
      
      if (error) {
        setErrors({ general: getAuthErrorMessage(error) });
      } else {
        setResetEmailSent(true);
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    // Animate out current form
    gsap.to('.auth-form', {
      opacity: 0,
      y: 20,
      duration: 0.3,
      onComplete: () => {
        navigate(isLogin ? ROUTES.REGISTER : ROUTES.LOGIN);
        // Animate in new form
        gsap.fromTo('.auth-form',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.3 }
        );
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image */}
      {/* Left Side - Image */}
<div className="hidden lg:block lg:w-1/2 relative overflow-hidden min-h-screen">
  <img 
    src={authBg}
    alt="Luxury Home"
    className="absolute inset-0 w-full h-full object-cover brightness-90"
  />
  <div className="absolute inset-0  bg-opacity-30 backdrop-blur-[1px]" />
  <div className="relative h-full flex items-center justify-center p-12">
    
  </div>
</div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo - Only visible on mobile */}
          

          <div className="text-center">
            <h2 className="text-3xl font-bold text-black mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin
                ? 'Sign in to access your account'
                : 'Join us to start your journey'}
            </p>
          </div>

          {/* Email Verification Success Message */}
          {resetEmailSent && !showPasswordReset && (
            <div className="auth-form mt-8 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800">
                {isLogin
                  ? 'Password reset email sent! Please check your inbox.'
                  : 'Account created! Please check your email to verify your account before signing in.'}
              </p>
            </div>
          )}

          {/* Password Reset Form */}
          {showPasswordReset && !resetEmailSent ? (
            <form className="auth-form mt-8 space-y-6" onSubmit={handlePasswordReset}>
              <div>
                <h3 className="text-lg font-semibold text-black mb-2">Reset Password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setErrors({});
                    setResetEmailSent(false);
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-lg font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 border border-transparent rounded-xl text-lg font-medium text-white bg-black hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          ) : showPasswordReset && resetEmailSent ? (
            <div className="auth-form mt-8 space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-800">
                  Password reset email sent! Please check your inbox and follow the instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(false);
                  setResetEmailSent(false);
                  setErrors({});
                }}
                className="w-full py-3 px-4 border border-transparent rounded-xl text-lg font-medium text-white bg-black hover:bg-black/90 transition-all duration-200"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form className="auth-form mt-8 space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {isLogin && (
              <>
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={rememberMe}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="text-sm text-black hover:text-gray-700 transition-colors duration-200"
                  >
                    Forgot your password?
                  </button>
                </div>
              </>
            )}

              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-lg font-medium text-white bg-black hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-black hover:text-gray-700 font-medium transition-colors duration-200"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By continuing, you agree to Maxed Homes'
              <button type="button" className="mx-1 text-black hover:text-gray-700">
                Terms of Service
              </button>
              and
              <button type="button" className="ml-1 text-black hover:text-gray-700">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
