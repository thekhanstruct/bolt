import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">CommunityHub</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              One platform for your<br />community and content.
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md">
              Manage your public website, announcements, and documents — all from a single
              administrative dashboard built for organizations.
            </p>
          </div>
          <div className="flex gap-8 text-slate-400 text-sm">
            <div>
              <div className="text-2xl font-bold text-white">2+</div>
              <div>Organizations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">4</div>
              <div>Role levels</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">100%</div>
              <div>RLS secured</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">CommunityHub</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
      />
    </div>
  );
}

export function AuthButton({ children, loading, onClick }: { children: React.ReactNode; loading: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
    >
      {loading && (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 animate-spin">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

export function AuthLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-slate-900 font-medium hover:underline">
      {children}
    </Link>
  );
}
