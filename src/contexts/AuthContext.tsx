import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

// "พิมพ์เขียว" ของโปรไฟล์ (ต้องตรงกับตาราง profiles ที่เราสร้าง!)
export interface Profile {
  id: string; // uuid
  username: string;
  avatar_url: string | null;
}

// "พิมพ์เขียว" ของข้อมูลที่ Context จะส่งให้ลูกๆ
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  refreshSession: () => Promise<void>; // 👈 NEW
}

// 1. สร้าง Context (กล่องเปล่าๆ)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. สร้าง "ผู้ให้บริการ" (Provider) ที่จะหุ้มแอปของเรา
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // ฟังก์ชันสำหรับดึงโปรไฟล์
  const getProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const { data, error, status } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && status !== 406) {
      // 406 (Not Found) คือ Profile หายไป ให้ถือว่าไม่ Error และ Profile เป็น null
      setProfile(null);
    } else if (status === 406) {
      setProfile(null); // ไม่พบ Row -> Profile เป็น null
    } else if (data) {
      setProfile(data as Profile); // พบ Row -> Profile ถูกตั้งค่า
    }
  };

  // 💡 [NEW] ฟังก์ชันดึง Session และ User ล่าสุด
  const refreshSession = async () => {
    const { data: { session: supaSession } } = await supabase.auth.getSession();
    setSession(supaSession);
    setUser(supaSession?.user ?? null);
  };

  // 💡 [แก้ไข] useEffect ตัวที่ 1: จัดการ Listener
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, supaSession) => {
        setSession(supaSession);
        setUser(supaSession?.user ?? null);
        // ❌ setLoading(false); ถูกลบออก!
      }
    );

    // ดึง Session ครั้งแรก
    const fetchSession = async () => {
      const { data: { session: supaSession } } = await supabase.auth.getSession();
      setSession(supaSession);
      setUser(supaSession?.user ?? null);
    };
    fetchSession();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []); // รันแค่ครั้งเดียว

  // ดึง profile ทุกครั้งที่ user เปลี่ยน
  useEffect(() => {
    if (user === undefined) { 
        return; 
    }
    setLoading(true);
    getProfile().finally(() => {
        setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // 👈 ต้องเหลือแค่ [user] เท่านั้น

  // ฟังก์ชัน Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    logout,
    refetchProfile: getProfile,
    refreshSession: refreshSession, // 👈 เพิ่มใน Context Value
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">Loading from AuthContext...</div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. สร้าง "Hook" (ทางลัด) ให้ลูกๆ เรียกใช้
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};