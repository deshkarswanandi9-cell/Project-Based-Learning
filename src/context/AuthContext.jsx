import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    setLoading(true);
    const { data: s } = await supabase.from('students')
      .select('*').eq('user_id', userId).maybeSingle();
    if (s) { setProfile(s); setRole('student'); setLoading(false); return; }
    const { data: t } = await supabase.from('teachers')
      .select('*').eq('user_id', userId).maybeSingle();
    if (t) {
      setProfile(t);
      if (t.is_approved) {
        setRole('teacher');
      } else {
        setRole('unapproved_teacher');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    // Handle initial session, gracefully clear on invalid refresh token
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Expired / missing refresh token — clear local storage and show login
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      else setLoading(false);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        // If token refresh fails, Supabase fires SIGNED_OUT — just clear state
        if (event === 'TOKEN_REFRESHED' && !session) {
          setUser(null); setProfile(null); setRole(null); setLoading(false);
          return;
        }
        if (session?.user) { 
          setLoading(true);
          setUser(session.user); 
          fetchProfile(session.user.id); 
        }
        else { setUser(null); setProfile(null); setRole(null); setLoading(false); }
      });
    return () => subscription.unsubscribe();
  }, []);

  const studentRegister = async ({ fullName, email, password,
    rollNumber, rbtNumber, department, year, semester, academic_year, phone }) => {
    const { data, error } = await supabase.auth.signUp(
      { email: email.trim().toLowerCase(), password }
    );
    if (error) throw new Error(error.message);
    const { error: pe } = await supabase.from('students').insert({
      user_id: data.user.id, full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      roll_number: rollNumber.trim(), rbt_number: rbtNumber.trim(),
      department, year, semester, academic_year, phone: phone.trim(),
    });
    if (pe) throw new Error(pe.message);
    return data;
  };

  const studentLogin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword(
      { email: email.trim().toLowerCase(), password }
    );
    if (error) throw new Error(error.message);

    const { data: s } = await supabase.from('students')
      .select('*').eq('user_id', data.user.id).maybeSingle();
    if (!s) { await supabase.auth.signOut();
      throw new Error('No student account found with this email'); }
    return data;
  };

  const teacherRegister = async ({ fullName, email, password,
    department, yearOfJoining }) => {
    const { data, error } = await supabase.auth.signUp(
      { email: email.trim().toLowerCase(), password }
    );
    if (error) throw new Error(error.message);
    const { error: pe } = await supabase.from('teachers').insert({
      user_id: data.user.id, full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      department, year_of_joining: parseInt(yearOfJoining), is_approved: false,
    });
    if (pe) throw new Error(pe.message);
    return data;
  };

  const teacherLogin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword(
      { email: email.trim().toLowerCase(), password }
    );
    if (error) throw new Error(error.message);

    const { data: t } = await supabase.from('teachers')
      .select('*').eq('user_id', data.user.id).maybeSingle();
    if (!t) {
      await supabase.auth.signOut();
      throw new Error('No teacher account found with this email');
    }
    if (!t.is_approved) {
      await supabase.auth.signOut();
      throw new Error('Your faculty account has been registered but is pending administrator approval. Please contact your Department PBL Coordinator.');
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, role, loading,
      isAuthenticated: !!user && !!profile,
      studentRegister, studentLogin,
      teacherRegister, teacherLogin, logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
