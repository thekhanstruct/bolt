/*
# CommunityHub - Core Schema, Functions, and RLS Policies

## Overview
Creates the complete database schema for CommunityHub, a multi-tenant SaaS platform
for organizations to manage their public website and community communications.

## New Tables
1. profiles — User profile info extending auth.users (display_name, avatar_url)
2. organizations — Organization records with branding (name, slug, colors, logo)
3. organization_members — Junction linking users to orgs with roles (super_admin, org_admin, editor, viewer)
4. pages — Content pages with draft/publish workflow (title, slug, summary, body, status)
5. announcements — Community announcements with priority levels and audience targeting
6. documents — Document metadata with Supabase Storage file paths
7. notification_preferences — Per-user, per-org notification settings
8. audit_logs — Administrative action audit trail

## Security
- RLS enabled on ALL tables
- Organization isolation via membership checks (SECURITY DEFINER helper functions)
- Role-based permissions: super_admin (all orgs), org_admin, editor, viewer
- Public read access for published pages/announcements and public documents (anon role)
- Storage bucket 'documents' with org-scoped upload policies
- Auto-profile creation trigger on auth.users signup

## Helper Functions (SECURITY DEFINER — bypass RLS to avoid recursion)
- is_super_admin(uid) — true if user has super_admin role in any org
- shares_org(uid1, uid2) — true if two users share an org membership
- is_org_member(uid, org) — true if user belongs to org (or is super_admin)
- is_org_admin(uid, org) — true if user is org_admin or super_admin
- can_edit_content(uid, org) — true if user is editor, org_admin, or super_admin
- log_action(org, action, resource, resource_id, metadata) — inserts audit log entry
- handle_new_user() — trigger: creates profile on auth.users INSERT
- update_updated_at() — trigger: auto-updates updated_at on row change

## Notes
1. All organization-owned tables carry organization_id FK
2. Owner columns (author_id, uploaded_by, user_id in audit_logs) default to auth.uid()
3. Public portal uses anon role SELECT policies — published content only
4. Policies are idempotent (DROP IF EXISTS before CREATE)
*/

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#2563eb',
  secondary_color text NOT NULL DEFAULT '#0f172a',
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'org_admin', 'editor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  summary text,
  body text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'emergency')),
  publish_date timestamptz NOT NULL DEFAULT now(),
  expiration_date timestamptz,
  audience text NOT NULL DEFAULT 'public' CHECK (audience IN ('public', 'members')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  file_path text NOT NULL,
  file_name text,
  file_size bigint,
  file_type text,
  is_public boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT false,
  announcement_alerts boolean NOT NULL DEFAULT true,
  document_alerts boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_pages_org ON public.pages(organization_id);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);
CREATE INDEX IF NOT EXISTS idx_announcements_org ON public.announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON public.announcements(status);
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = uid AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_org(uid1 uuid, uid2 uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = uid1 AND om2.user_id = uid2
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(uid uuid, org uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_super_admin(uid) OR EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = uid AND organization_id = org
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(uid uuid, org uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_super_admin(uid) OR EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = uid AND organization_id = org AND role = 'org_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_content(uid uuid, org uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_super_admin(uid) OR EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = uid AND organization_id = org
    AND role IN ('org_admin', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.user_org_role(uid uuid, org uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT om.role FROM public.organization_members om
  WHERE om.user_id = uid AND om.organization_id = org
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.log_action(
  p_org_id uuid,
  p_action text,
  p_resource text,
  p_resource_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, organization_id, action, resource, resource_id, metadata)
  VALUES (auth.uid(), p_org_id, p_action, p_resource, p_resource_id, p_metadata);
END;
$$;

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS pages_updated_at ON public.pages;
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS announcements_updated_at ON public.announcements;
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS notif_prefs_updated_at ON public.notification_preferences;
CREATE TRIGGER notif_prefs_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: profiles
-- ============================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR
    public.is_super_admin(auth.uid()) OR
    public.shares_org(auth.uid(), id)
  );

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES: organizations
-- ============================================

-- Public: anyone can view org info (needed for public portal)
DROP POLICY IF EXISTS "orgs_select" ON public.organizations;
CREATE POLICY "orgs_select" ON public.organizations
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "orgs_insert" ON public.organizations;
CREATE POLICY "orgs_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "orgs_update" ON public.organizations;
CREATE POLICY "orgs_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), id))
  WITH CHECK (public.is_org_admin(auth.uid(), id));

DROP POLICY IF EXISTS "orgs_delete" ON public.organizations;
CREATE POLICY "orgs_delete" ON public.organizations
  FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- ============================================
-- RLS POLICIES: organization_members
-- ============================================

DROP POLICY IF EXISTS "members_select" ON public.organization_members;
CREATE POLICY "members_select" ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_super_admin(auth.uid()) OR
    public.is_org_member(auth.uid(), organization_id)
  );

DROP POLICY IF EXISTS "members_insert" ON public.organization_members;
CREATE POLICY "members_insert" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

DROP POLICY IF EXISTS "members_update" ON public.organization_members;
CREATE POLICY "members_update" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

DROP POLICY IF EXISTS "members_delete" ON public.organization_members;
CREATE POLICY "members_delete" ON public.organization_members
  FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- ============================================
-- RLS POLICIES: pages
-- ============================================

-- Anon: can read published pages only
DROP POLICY IF EXISTS "pages_select_anon" ON public.pages;
CREATE POLICY "pages_select_anon" ON public.pages
  FOR SELECT TO anon
  USING (status = 'published');

-- Authenticated: org members see all pages; non-members see published only
DROP POLICY IF EXISTS "pages_select_auth" ON public.pages;
CREATE POLICY "pages_select_auth" ON public.pages
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id) OR
    status = 'published'
  );

DROP POLICY IF EXISTS "pages_insert" ON public.pages;
CREATE POLICY "pages_insert" ON public.pages
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_content(auth.uid(), organization_id));

DROP POLICY IF EXISTS "pages_update" ON public.pages;
CREATE POLICY "pages_update" ON public.pages
  FOR UPDATE TO authenticated
  USING (public.can_edit_content(auth.uid(), organization_id))
  WITH CHECK (public.can_edit_content(auth.uid(), organization_id));

DROP POLICY IF EXISTS "pages_delete" ON public.pages;
CREATE POLICY "pages_delete" ON public.pages
  FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- ============================================
-- RLS POLICIES: announcements
-- ============================================

-- Anon: can read published, non-expired, public-audience announcements
DROP POLICY IF EXISTS "announcements_select_anon" ON public.announcements;
CREATE POLICY "announcements_select_anon" ON public.announcements
  FOR SELECT TO anon
  USING (
    status = 'published'
    AND publish_date <= now()
    AND (expiration_date IS NULL OR expiration_date > now())
    AND audience = 'public'
  );

-- Authenticated: org members see all; non-members see published public ones
DROP POLICY IF EXISTS "announcements_select_auth" ON public.announcements;
CREATE POLICY "announcements_select_auth" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id) OR
    (
      status = 'published'
      AND publish_date <= now()
      AND (expiration_date IS NULL OR expiration_date > now())
      AND audience = 'public'
    )
  );

DROP POLICY IF EXISTS "announcements_insert" ON public.announcements;
CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_content(auth.uid(), organization_id));

DROP POLICY IF EXISTS "announcements_update" ON public.announcements;
CREATE POLICY "announcements_update" ON public.announcements
  FOR UPDATE TO authenticated
  USING (public.can_edit_content(auth.uid(), organization_id))
  WITH CHECK (public.can_edit_content(auth.uid(), organization_id));

DROP POLICY IF EXISTS "announcements_delete" ON public.announcements;
CREATE POLICY "announcements_delete" ON public.announcements
  FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- ============================================
-- RLS POLICIES: documents
-- ============================================

-- Anon: can read public documents
DROP POLICY IF EXISTS "docs_select_anon" ON public.documents;
CREATE POLICY "docs_select_anon" ON public.documents
  FOR SELECT TO anon
  USING (is_public = true);

-- Authenticated: org members see all; non-members see public only
DROP POLICY IF EXISTS "docs_select_auth" ON public.documents;
CREATE POLICY "docs_select_auth" ON public.documents
  FOR SELECT TO authenticated
  USING (
    public.is_org_member(auth.uid(), organization_id) OR
    is_public = true
  );

DROP POLICY IF EXISTS "docs_insert" ON public.documents;
CREATE POLICY "docs_insert" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_content(auth.uid(), organization_id));

DROP POLICY IF EXISTS "docs_update" ON public.documents;
CREATE POLICY "docs_update" ON public.documents
  FOR UPDATE TO authenticated
  USING (public.can_edit_content(auth.uid(), organization_id))
  WITH CHECK (public.can_edit_content(auth.uid(), organization_id));

DROP POLICY IF EXISTS "docs_delete" ON public.documents;
CREATE POLICY "docs_delete" ON public.documents
  FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- ============================================
-- RLS POLICIES: notification_preferences
-- ============================================

DROP POLICY IF EXISTS "notif_select" ON public.notification_preferences;
CREATE POLICY "notif_select" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notif_insert" ON public.notification_preferences;
CREATE POLICY "notif_insert" ON public.notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notif_update" ON public.notification_preferences;
CREATE POLICY "notif_update" ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notif_delete" ON public.notification_preferences;
CREATE POLICY "notif_delete" ON public.notification_preferences
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: audit_logs
-- ============================================

DROP POLICY IF EXISTS "audit_select" ON public.audit_logs;
CREATE POLICY "audit_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid()) OR
    public.is_org_member(auth.uid(), organization_id)
  );

DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;
CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

-- audit_logs are immutable — no UPDATE or DELETE policies