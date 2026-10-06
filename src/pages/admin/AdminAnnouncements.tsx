import { useEffect, useState, useCallback } from 'react';
import { Plus, Megaphone, Trash2, Pencil, AlertTriangle, Calendar, X } from 'lucide-react';
import { useOrgData } from '@/hooks/useOrgData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate, statusColor, priorityColor, initials } from '@/lib/utils';
import type { Announcement, AnnouncementPriority, AnnouncementStatus, AnnouncementAudience } from '@/types';

const priorities: AnnouncementPriority[] = ['normal', 'important', 'emergency'];
const audiences: AnnouncementAudience[] = ['public', 'members'];

export default function AdminAnnouncements() {
  const { orgId, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, logAction } = useOrgData();
  const { activeRole } = useAuth();
  const toast = useToast();
  const canEdit = activeRole === 'super_admin' || activeRole === 'org_admin' || activeRole === 'editor';
  const canDelete = activeRole === 'super_admin' || activeRole === 'org_admin';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const load = useCallback(() => {
    if (!orgId) return;
    setLoading(true);
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAnnouncement(deleteTarget.id);
      await logAction('announcement.deleted', 'announcement', deleteTarget.id, { title: deleteTarget.title });
      toast.success('Announcement deleted');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Communicate with your community.</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No announcements yet</p>
          <p className="text-gray-400 text-sm mt-1">Create an announcement to communicate with your community.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const pc = priorityColor(ann.priority);
            const sc = statusColor(ann.status);
            return (
              <div key={ann.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{ann.title}</h3>
                      <Badge className={`${sc.bg} ${sc.text}`}>{sc.label}</Badge>
                      <Badge className={`${pc.bg} ${pc.text} ${pc.border}`}>{pc.label}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{ann.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(ann.publish_date)}
                      </span>
                      {ann.expiration_date && (
                        <span className="flex items-center gap-1">
                          Expires {formatDate(ann.expiration_date)}
                        </span>
                      )}
                      {ann.author && (
                        <span className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-semibold text-slate-600">
                            {initials(ann.author.display_name)}
                          </div>
                          {ann.author.display_name}
                        </span>
                      )}
                    </div>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {canEdit && (
                        <button
                          onClick={() => { setEditing(ann); setShowForm(true); }}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(ann)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <AnnouncementForm
          announcement={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={async (data) => {
            try {
              if (editing) {
                await updateAnnouncement(editing.id, data);
                await logAction('announcement.edited', 'announcement', editing.id, { title: data.title });
                toast.success('Announcement updated');
              } else {
                const ann = await createAnnouncement(data);
                await logAction('announcement.created', 'announcement', ann.id, { title: data.title });
                toast.success('Announcement created');
              }
              setShowForm(false);
              setEditing(null);
              load();
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Failed to save announcement';
              toast.error(msg);
            }
          }}
        />
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete announcement" size="sm">
        <p className="text-gray-600">
          Delete <strong className="text-gray-900">{deleteTarget?.title}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

interface AnnouncementFormProps {
  announcement: Announcement | null;
  onClose: () => void;
  onSave: (data: Partial<Announcement>) => Promise<void>;
}

function AnnouncementForm({ announcement, onClose, onSave }: AnnouncementFormProps) {
  const [title, setTitle] = useState(announcement?.title || '');
  const [message, setMessage] = useState(announcement?.message || '');
  const [priority, setPriority] = useState<AnnouncementPriority>(announcement?.priority || 'normal');
  const [status, setStatus] = useState<AnnouncementStatus>(announcement?.status || 'draft');
  const [audience, setAudience] = useState<AnnouncementAudience>(announcement?.audience || 'public');
  const [publishDate, setPublishDate] = useState(
    announcement?.publish_date ? new Date(announcement.publish_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  );
  const [expirationDate, setExpirationDate] = useState(
    announcement?.expiration_date ? new Date(announcement.expiration_date).toISOString().slice(0, 16) : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !message.trim()) return;
    setSaving(true);
    await onSave({
      title: title.trim(),
      message: message.trim(),
      priority,
      status,
      audience,
      publish_date: new Date(publishDate).toISOString(),
      expiration_date: expirationDate ? new Date(expirationDate).toISOString() : null,
    });
    setSaving(false);
  };

  return (
    <Modal open={true} onClose={onClose} title={announcement ? 'Edit Announcement' : 'New Announcement'} size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Announcement message"
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>{priorityColor(p).label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
            >
              {audiences.map((a) => (
                <option key={a} value={a}>{a === 'public' ? 'Public' : 'Members only'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AnnouncementStatus)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Publish date</label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Expiration date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !message.trim()}
            className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <LoadingSpinner size="sm" /> : announcement ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
