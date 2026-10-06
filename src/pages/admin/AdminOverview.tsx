import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Megaphone, FolderOpen, Users, FileEdit, Eye, TrendingUp, Clock } from 'lucide-react';
import { useOrgData } from '@/hooks/useOrgData';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { formatDate, timeAgo, statusColor, priorityColor, roleLabel } from '@/lib/utils';
import type { Page, Announcement, DocumentItem, OrganizationMember, AuditLog, Profile } from '@/types';

interface Stats {
  publishedPages: number;
  draftPages: number;
  announcements: number;
  documents: number;
  members: number;
}

export default function AdminOverview() {
  const { orgId, fetchPages, fetchAnnouncements, fetchDocuments, fetchMembers, fetchAuditLogs } = useOrgData();
  const { activeOrganization, activeRole, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ publishedPages: 0, draftPages: 0, announcements: 0, documents: 0, members: 0 });
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);
    Promise.all([fetchPages(), fetchAnnouncements(), fetchDocuments(), fetchMembers(), fetchAuditLogs(8)])
      .then(([pages, anns, docs, members, logs]) => {
        setStats({
          publishedPages: pages.filter((p) => p.status === 'published').length,
          draftPages: pages.filter((p) => p.status === 'draft').length,
          announcements: anns.filter((a) => a.status === 'published').length,
          documents: docs.length,
          members: (members as (OrganizationMember & { profile: Profile })[]).length,
        });
        setRecentAnnouncements(anns.slice(0, 4));
        setRecentActivity(logs);
      })
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    { label: 'Published Pages', value: stats.publishedPages, icon: FileText, color: 'bg-emerald-50 text-emerald-600', to: '/admin/pages' },
    { label: 'Draft Pages', value: stats.draftPages, icon: FileEdit, color: 'bg-gray-100 text-gray-600', to: '/admin/pages' },
    { label: 'Announcements', value: stats.announcements, icon: Megaphone, color: 'bg-blue-50 text-blue-600', to: '/admin/announcements' },
    { label: 'Documents', value: stats.documents, icon: FolderOpen, color: 'bg-amber-50 text-amber-600', to: '/admin/documents' },
    { label: 'Team Members', value: stats.members, icon: Users, color: 'bg-slate-100 text-slate-600', to: '/admin/users' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.display_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-gray-500 mt-1">
          {activeOrganization?.name} · {roleLabel(activeRole || '')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent announcements */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Announcements</h2>
            <Link to="/admin/announcements" className="text-sm text-slate-900 hover:underline">View all</Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No announcements yet</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((ann) => {
                const pc = priorityColor(ann.priority);
                const sc = statusColor(ann.status);
                return (
                  <div key={ann.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      ann.priority === 'emergency' ? 'bg-red-500' : ann.priority === 'important' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{ann.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${sc.bg} ${sc.text}`}>{sc.label}</Badge>
                        <Badge className={`${pc.bg} ${pc.text}`}>{pc.label}</Badge>
                        <span className="text-xs text-gray-400">{formatDate(ann.publish_date)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/admin/audit-log" className="text-sm text-slate-900 hover:underline">View all</Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.profile?.display_name || 'Unknown'}</span>{' '}
                      <span className="text-gray-500">{log.action.replace(/[._]/g, ' ')}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
