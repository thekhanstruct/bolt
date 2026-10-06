import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout, AuthInput, AuthButton, AuthLink } from '@/components/auth/AuthLayout';

export default function SignupPage() {
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/admin', { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, displayName);
    setSubmitting(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Account created" subtitle="Your account has been set up.">
        <div className="space-y-4">
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            Account created successfully. You can now sign in with your credentials.
          </div>
          <Link to="/login" className="block w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium text-center hover:bg-slate-800 transition">
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Get started with CommunityHub.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput label="Display name" value={displayName} onChange={setDisplayName} placeholder="Jane Doe" required autoFocus />
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@organization.edu" required />
        <AuthInput label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" required />
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <AuthButton loading={submitting}>Create account</AuthButton>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account? <AuthLink to="/login">Sign in</AuthLink>
      </p>
    </AuthLayout>
  );
}
