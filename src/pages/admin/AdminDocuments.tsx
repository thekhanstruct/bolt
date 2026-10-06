import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, FolderOpen, Trash2, Download, FileText, Upload, X } from 'lucide-react';
import { useOrgData } from '@/hooks/useOrgData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatBytes, initials } from '@/lib/utils';
import type { DocumentItem } from '@/types';

export default function AdminDocuments() {
  const { orgId, org, fetchDocuments, createDocument, deleteDocument, logAction } = useOrgData();
  const { activeRole } = useAuth();
  const toast = useToast();
  const canEdit = activeRole === 'super_admin' || activeRole === 'org_admin' || activeRole === 'editor';
  const canDelete = activeRole === 'super_admin' || activeRole === 'org_admin';

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);

  const load = useCallback(() => {
    if (!orgId) return;
    setLoading(true);
    fetchDocuments()
      .then(setDocuments)
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const categories = Array.from(new Set(documents.map((d) => d.category))).sort();

  const filtered = documents.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || (d.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error: storageError } = await supabase.storage.from('documents').remove([deleteTarget.file_path]);
      if (storageError) console.warn('Storage cleanup warning:', storageError.message);

      await deleteDocument(deleteTarget.id);
      await logAction('document.deleted', 'document', deleteTarget.id, { title: deleteTarget.title });
      toast.success('Document deleted');
      setDeleteTarget(null);
      load();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.file_path, 3600);
      if (error || !data) throw error;
      window.open(data.signedUrl, '_blank');
    } catch {
      toast.error('Failed to generate download link');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Upload and manage organizational documents.</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No documents found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search || categoryFilter !== 'all' ? 'Try adjusting your filters.' : 'Upload your first document to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition group">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate" title={doc.title}>{doc.title}</h3>
                  <Badge className="bg-gray-100 text-gray-600 mt-1">{doc.category}</Badge>
                </div>
              </div>
              {doc.description && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{doc.description}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-400">
                  <p>{formatBytes(doc.file_size)}</p>
                  <p>{formatDate(doc.created_at)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => setDeleteTarget(doc)}
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {doc.uploader && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
                  <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-semibold text-slate-600">
                    {initials(doc.uploader.display_name)}
                  </div>
                  {doc.uploader.display_name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showUpload && org && (
        <UploadForm
          orgSlug={org.slug}
          onClose={() => setShowUpload(false)}
          onUploaded={async (file, filePath, fileData) => {
            try {
              const doc = await createDocument({
                title: fileData.title,
                description: fileData.description || null,
                category: fileData.category,
                file_path: filePath,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                is_public: fileData.isPublic,
              });
              await logAction('document.uploaded', 'document', doc.id, { title: fileData.title });
              toast.success('Document uploaded successfully');
              setShowUpload(false);
              load();
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Failed to save document metadata';
              toast.error(msg);
            }
          }}
        />
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete document" size="sm">
        <p className="text-gray-600">
          Delete <strong className="text-gray-900">{deleteTarget?.title}</strong>? The file and metadata will be permanently removed.
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

interface UploadFormProps {
  orgSlug: string;
  onClose: () => void;
  onUploaded: (file: File, filePath: string, fileData: { title: string; description: string; category: string; isPublic: boolean }) => Promise<void>;
}

function UploadForm({ orgSlug, onClose, onUploaded }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `${orgSlug}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) throw uploadError;

      await onUploaded(file, filePath, { title, description, category, isPublic });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      throw new Error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Upload Document" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">File (PDF)</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-gray-700">
                <FileText className="w-5 h-5" />
                <span className="font-medium">{file.name}</span>
                <span className="text-gray-400">({formatBytes(file.size)})</span>
              </div>
            ) : (
              <div className="text-gray-400">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Click to select a file</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="hidden" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Policies, Reports"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibility</label>
            <select
              value={isPublic ? 'public' : 'private'}
              onChange={(e) => setIsPublic(e.target.value === 'public')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-white"
            >
              <option value="public">Public</option>
              <option value="private">Private (members only)</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2">
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !title.trim()}
            className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? <LoadingSpinner size="sm" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
