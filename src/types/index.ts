export type UserRole = 'super_admin' | 'org_admin' | 'editor' | 'viewer';

export type PageStatus = 'draft' | 'published';
export type AnnouncementPriority = 'normal' | 'important' | 'emergency';
export type AnnouncementStatus = 'draft' | 'published';
export type AnnouncementAudience = 'public' | 'members';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  profile?: Profile;
}

export interface Page {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  status: PageStatus;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Announcement {
  id: string;
  organization_id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  publish_date: string;
  expiration_date: string | null;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface DocumentItem {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  is_public: boolean;
  uploaded_by: string | null;
  created_at: string;
  uploader?: Profile;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  organization_id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profile?: Profile;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  organization_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  announcement_alerts: boolean;
  document_alerts: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  user: import('@supabase/supabase-js').User | null;
  profile: Profile | null;
  memberships: (OrganizationMember & { organizations: Organization })[];
  activeOrganization: Organization | null;
  activeRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  switchOrganization: (orgId: string) => void;
  refreshProfile: () => Promise<void>;
}
