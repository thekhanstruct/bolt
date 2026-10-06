import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout, AuthInput, AuthButton, AuthLink } from '@/components/auth/AuthLayout';

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.includes('Invalid login credentials')
        ? 'Invalid email or password. Please try again.'
        : error);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back. Sign in to manage your organization.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@organization.edu" required autoFocus />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link to="/forgot-password" className="text-xs text-slate-900 hover:underline">Forgot password?</Link>
          </div>
          <AuthInput label="" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
        </div>
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <AuthButton loading={submitting}>Sign in</AuthButton>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account? <AuthLink to="/signup">Sign up</AuthLink>
      </p>
      <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        <p className="font-semibold mb-1">Demo accounts (password: Demo1234!):</p>
        <p>admin@northstar.edu — Org Admin</p>
        <p>editor@northstar.edu — Editor</p>
        <p>viewer@northstar.edu — Viewer</p>
      </div>
    </AuthLayout>
  );
}
