import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type {
  AuthContextValue,
  Profile,
  OrganizationMember,
  Organization,
  UserRole,
} from '@/types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACTIVE_ORG_KEY = 'communityhub_active_org';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<(OrganizationMember & { organizations: Organization })[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (currentUser: User) => {
    const [profileRes, membersRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
      supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('user_id', currentUser.id),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);

    const memberData = (membersRes.data || []) as (OrganizationMember & { organizations: Organization })[];
    setMemberships(memberData);

    if (memberData.length > 0) {
      const storedOrgId = localStorage.getItem(ACTIVE_ORG_KEY);
      const orgToActivate =
        memberData.find((m) => m.organization_id === storedOrgId)?.organizations ||
        memberData[0].organizations;
      setActiveOrganization(orgToActive);
      localStorage.setItem(ACTIVE_ORG_KEY, orgToActivate.id);
    } else {
      setActiveOrganization(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        fetchUserData(sessionUser).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        (async () => {
          await fetchUserData(sessionUser);
          if (mounted) setLoading(false);
        })();
      } else {
        setProfile(null);
        setMemberships([]);
        setActiveOrganization(null);
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { error: error.message };
    if (data.user && !data.session) {
      return {
        error: null,
      };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMemberships([]);
    setActiveOrganization(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, []);

  const switchOrganization = useCallback(
    (orgId: string) => {
      const org = memberships.find((m) => m.organization_id === orgId)?.organizations;
      if (org) {
        setActiveOrganization(org);
        localStorage.setItem(ACTIVE_ORG_KEY, org.id);
      }
    },
    [memberships]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) setProfile(data as Profile);
  }, [user]);

  const activeRole: UserRole | null = activeOrganization
    ? memberships.find((m) => m.organization_id === activeOrganization.id)?.role ?? null
    : null;

  const value: AuthContextValue = {
    user,
    profile,
    memberships,
    activeOrganization,
    activeRole,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    switchOrganization,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
