import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Globe, Lock } from 'lucide-react';
import { useOrgData } from '@/hooks/useOrgData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/Spinner';
import { slugify } from '@/lib/utils';
import type { Page, PageStatus } from '@/types';

export default function PageEditor() {
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const { activeRole } = useAuth();
  const { fetchPage, createPage, updatePage, logAction } = useOrgData();
  const canEdit = activeRole === 'super_admin' || activeRole === 'org_admin' || activeRole === 'editor';

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<PageStatus>('draft');
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!isEditing || !id) return;
    setLoading(true);
    fetchPage(id)
      .then((page) => {
        if (page) {
          setTitle(page.title);
          setSlug(page.slug);
          setSummary(page.summary || '');
          setBody(page.body || '');
          setStatus(page.status);
        }
      })
      .catch(() => toast.error('Failed to load page'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const handleSave = async (publishStatus?: PageStatus) => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    setSaving(true);
    const targetStatus = publishStatus || status;
    const updates: Partial<Page> = {
      title: title.trim(),
      slug: slugify(slug),
      summary: summary.trim() || null,
      body: body.trim() || null,
      status: targetStatus,
      published_at: targetStatus === 'published' ? new Date().toISOString() : null,
    };

    try {
      if (isEditing && id) {
        const oldStatus = status;
        await updatePage(id, updates);
        if (oldStatus !== 'published' && targetStatus === 'published') {
          await logAction('page.published', 'page', id, { title });
        } else {
          await logAction('page.edited', 'page', id, { title });
        }
        toast.success('Page saved successfully');
      } else {
        const page = await createPage(updates);
        await logAction('page.created', 'page', page.id, { title });
        toast.success(targetStatus === 'published' ? 'Page published' : 'Draft saved');
        navigate('/admin/pages');
        return;
      }
      setStatus(targetStatus);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save page';
      toast.error(msg.includes('duplicate') ? 'A page with this slug already exists' : msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  if (!canEdit) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">You don't have permission to edit pages</p>
        <Link to="/admin/pages" className="inline-block mt-4 text-slate-900 font-medium hover:underline">Back to pages</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/pages" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to pages
        </Link>
        <div className="flex items-center gap-2">
          {status === 'published' && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <Globe className="w-4 h-4" />
              Published
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">URL slug</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
              placeholder="page-slug"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A brief description shown in page listings and search results."
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Body content <span className="text-gray-400 font-normal">(Markdown supported)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="## Heading&#10;&#10;Write your page content here. Supports **bold**, *italic*, lists, and tables."
            rows={16}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono resize-y"
          />
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Globe className="w-4 h-4" />
            {status === 'published' ? 'Update & publish' : 'Publish'}
          </button>
          {saving && <LoadingSpinner size="sm" />}
        </div>
      </div>
    </div>
  );
}
