import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Eye, Pencil, Trash2, Globe, Lock } from 'lucide-react';
import { useOrgData } from '@/hooks/useOrgData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate, statusColor, initials } from '@/lib/utils';
import type { Page } from '@/types';

export default function AdminPages() {
  const { orgId, fetchPages, deletePage, logAction } = useOrgData();
  const { activeRole } = useAuth();
  const toast = useToast();
  const canEdit = activeRole === 'super_admin' || activeRole === 'org_admin' || activeRole === 'editor';
  const canDelete = activeRole === 'super_admin' || activeRole === 'org_admin';

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);

  const load = useCallback(() => {
    if (!orgId) return;
    setLoading(true);
    fetchPages()
      .then(setPages)
      .catch(() => toast.error('Failed to load pages'))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const filtered = pages.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePage(deleteTarget.id);
      await logAction('page.deleted', 'page', deleteTarget.id, { title: deleteTarget.title });
      toast.success('Page deleted successfully');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Failed to delete page');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages</h1>
          <p className="text-gray-500 mt-1">Create and manage your organization's web pages.</p>
        </div>
        {canEdit && (
          <Link
            to="/admin/pages/new"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" />
            New Page
          </Link>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition ${
                statusFilter === s ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No pages found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first page to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Author</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Updated</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((page) => {
                const sc = statusColor(page.status);
                return (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {page.status === 'published' ? <Globe className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{page.title}</p>
                          <p className="text-xs text-gray-400">/{page.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <Badge className={`${sc.bg} ${sc.text}`}>{sc.label}</Badge>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {page.author && (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-xs font-semibold text-slate-600">
                            {initials(page.author.display_name)}
                          </div>
                          <span className="text-sm text-gray-600">{page.author.display_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-sm text-gray-500">
                      {formatDate(page.updated_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/pages/${page.id}/edit`}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        {page.status === 'published' && (
                          <Link
                            to={`/portal/${page.organization_id}/${page.slug}`}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(page)}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete page"
        size="sm"
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong className="text-gray-900">{deleteTarget?.title}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
