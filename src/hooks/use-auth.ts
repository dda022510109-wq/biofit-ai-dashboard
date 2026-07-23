import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  name: string;
  email: string;
  metrics?: any;
  diary?: any[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Supabase 프로필 정보 로드 함수
  const fetchProfile = async (userId: string, email: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, metrics, diary")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        return null;
      }

      return {
        id: userId,
        email,
        name: data?.name || "사용자",
        metrics: data?.metrics || null,
        diary: data?.diary || [],
      };
    } catch (e) {
      console.error("Profile load failed:", e);
      return null;
    }
  };

  // 세션 복구 및 상태 리스너 등록
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile = await fetchProfile(session.user.id, session.user.email || "");
          if (profile && mounted) {
            setUser(profile);
          }
        }
      } catch (e) {
        console.error("Auth initialization failed:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === "SIGNED_IN" && session?.user) {
          setLoading(true);
          const profile = await fetchProfile(session.user.id, session.user.email || "");
          if (profile) {
            setUser(profile);
          }
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes("Invalid login credentials")) {
          msg = "이메일 또는 비밀번호가 일치하지 않습니다.";
        }
        return { success: false, message: msg };
      }

      return { success: true, message: "로그인 성공!" };
    } catch (e: any) {
      return { success: false, message: e.message || "로그인 중 에러가 발생했습니다." };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user && data.session === null) {
        // 이메일 확인 활성화 상태일 수 있음
        return { success: true, message: "가입을 환영합니다! 이메일 확인 메일이 발송되었습니다. (혹은 바로 로그인이 가능합니다)" };
      }

      return { success: true, message: "회원가입이 완료되었습니다!" };
    } catch (e: any) {
      return { success: false, message: e.message || "회원가입 중 에러가 발생했습니다." };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const saveUserData = async (updatedFields: Partial<User>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updatedFields)
        .eq("id", user.id);

      if (error) {
        console.error("Save user data failed:", error);
        return;
      }

      setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
    } catch (e) {
      console.error("Save user data failed:", e);
    }
  };

  return {
    user,
    loading,
    login,
    signup,
    logout,
    saveUserData,
  };
}
