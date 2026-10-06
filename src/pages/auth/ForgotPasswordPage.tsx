import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout, AuthInput, AuthButton, AuthLink } from '@/components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="Password reset instructions have been sent.">
        <div className="space-y-4">
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            If an account exists for {email}, you'll receive a password reset link shortly.
          </div>
          <Link to="/login" className="block w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-center hover:bg-slate-800 transition">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email to receive a reset link.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@organization.edu" required autoFocus />
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <AuthButton loading={submitting}>Send reset link</AuthButton>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Remember your password? <AuthLink to="/login">Sign in</AuthLink>
      </p>
    </AuthLayout>
  );
}
