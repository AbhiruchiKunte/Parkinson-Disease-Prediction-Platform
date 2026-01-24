
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkSession = async () => {
      // Check if we have a session in local storage
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have a session, use
      if (session) {
        setSession(session);
        setUser(session.user);
        ensureProfile(session.user);
        setLoading(false);
        return;
      }
      const hasCode = window.location.hash.includes('access_token') || 
                      window.location.search.includes('code=') ||
                      window.location.hash.includes('error_description');
                      
      if (!hasCode) {
        setLoading(false);
      }
    };
    
    checkSession();
    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureProfile = async (user: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!data && error?.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const parts = metaName.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

        const newProfile = {
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || '',
          updated_at: new Date(),
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);
          
        if (insertError) {
          console.error("Error creating user profile:", insertError);
        }
      }
    } catch (err) {
      console.error("Unexpected error checking profile:", err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
