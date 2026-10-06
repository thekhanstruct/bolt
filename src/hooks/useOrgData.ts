import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Page, Announcement, DocumentItem, OrganizationMember, AuditLog, Profile, Organization } from '@/types';

export function useOrgData() {
  const { activeOrganization } = useAuth();
  const orgId = activeOrganization?.id;

  return {
    orgId,
    org: activeOrganization,

    async fetchPages(): Promise<Page[]> {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*, author:profiles!pages_author_id_fkey(*)')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Page[];
    },

    async fetchPublishedPages(): Promise<Page[]> {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Page[];
    },

    async fetchPage(id: string): Promise<Page | null> {
      const { data, error } = await supabase
        .from('pages')
        .select('*, author:profiles!pages_author_id_fkey(*)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Page | null;
    },

    async createPage(page: Partial<Page>): Promise<Page> {
      if (!orgId) throw new Error('No active organization');
      const { data, error } = await supabase
        .from('pages')
        .insert({ ...page, organization_id: orgId })
        .select('*')
        .single();
      if (error) throw error;
      return data as Page;
    },

    async updatePage(id: string, updates: Partial<Page>): Promise<Page> {
      const { data, error } = await supabase
        .from('pages')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as Page;
    },

    async deletePage(id: string): Promise<void> {
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
    },

    async fetchAnnouncements(): Promise<Announcement[]> {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('announcements')
        .select('*, author:profiles!announcements_author_id_fkey(*)')
        .eq('organization_id', orgId)
        .order('publish_date', { ascending: false });
      if (error) throw error;
      return (data || []) as Announcement[];
    },

    async createAnnouncement(ann: Partial<Announcement>): Promise<Announcement> {
      if (!orgId) throw new Error('No active organization');
      const { data, error } = await supabase
        .from('announcements')
        .insert({ ...ann, organization_id: orgId })
        .select('*')
        .single();
      if (error) throw error;
      return data as Announcement;
    },

    async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as Announcement;
    },

    async deleteAnnouncement(id: string): Promise<void> {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },

    async fetchDocuments(): Promise<DocumentItem[]> {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*, uploader:profiles!documents_uploaded_by_fkey(*)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DocumentItem[];
    },

    async createDocument(doc: Partial<DocumentItem>): Promise<DocumentItem> {
      if (!orgId) throw new Error('No active organization');
      const { data, error } = await supabase
        .from('documents')
        .insert({ ...doc, organization_id: orgId })
        .select('*')
        .single();
      if (error) throw error;
      return data as DocumentItem;
    },

    async updateDocument(id: string, updates: Partial<DocumentItem>): Promise<DocumentItem> {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as DocumentItem;
    },

    async deleteDocument(id: string): Promise<void> {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },

    async fetchMembers(): Promise<(OrganizationMember & { profile: Profile })[]> {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('organization_members')
        .select('*, profile:profiles(*)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as (OrganizationMember & { profile: Profile })[];
    },

    async updateMemberRole(memberId: string, role: string): Promise<void> {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);
      if (error) throw error;
    },

    async fetchAuditLogs(limit = 50): Promise<AuditLog[]> {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profile:profiles(*)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as AuditLog[];
    },

    async logAction(action: string, resource: string, resourceId?: string, metadata?: Record<string, unknown>): Promise<void> {
      if (!orgId) return;
      await supabase.rpc('log_action', {
        p_org_id: orgId,
        p_action: action,
        p_resource: resource,
        p_resource_id: resourceId || null,
        p_metadata: metadata || {},
      });
    },

    async updateOrganization(updates: Partial<Organization>): Promise<void> {
      if (!orgId) return;
      const { error } = await supabase.from('organizations').update(updates).eq('id', orgId);
      if (error) throw error;
    },
  };
}
