import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout, AuthInput, AuthButton } from '@/components/auth/AuthLayout';

export default function ResetPasswordPage() {
  const { updatePassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/admin', { replace: true }), 2000);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password updated" subtitle="Your password has been changed successfully.">
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          Password updated successfully. Redirecting to your dashboard...
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Enter your new password below.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput label="New password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" required autoFocus />
        <AuthInput label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter password" required />
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <AuthButton loading={submitting}>Update password</AuthButton>
      </form>
    </AuthLayout>
  );
}
