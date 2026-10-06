export function formatDate(date: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    org_admin: 'Org Admin',
    editor: 'Editor',
    viewer: 'Viewer',
  };
  return labels[role] ?? role;
}

export function priorityColor(priority: string): { bg: string; text: string; border: string; label: string } {
  switch (priority) {
    case 'emergency':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Emergency' };
    case 'important':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Important' };
    default:
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Normal' };
  }
}

export function statusColor(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'published':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Published' };
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
  }
}
