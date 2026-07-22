import { useState, useEffect } from "react";

export interface User {
  name: string;
  email: string;
  password?: string; // 심플하게 관리
  metrics?: any;
  diary?: any[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("biofit_session");
    if (session) {
      try {
        const email = JSON.parse(session);
        const users = JSON.parse(localStorage.getItem("biofit_users") || "[]");
        const found = users.find((u: any) => u.email === email);
        if (found) {
          setUser(found);
        }
      } catch (e) {
        console.error("Session restore failed", e);
      }
    }
    setLoading(false);
  }, []);

  const login = (email: string, password: string): { success: boolean; message: string } => {
    const users = JSON.parse(localStorage.getItem("biofit_users") || "[]");
    const found = users.find((u: any) => u.email === email);
    
    if (!found) {
      return { success: false, message: "존재하지 않는 이메일 주소입니다." };
    }
    if (found.password !== password) {
      return { success: false, message: "비밀번호가 일치하지 않습니다." };
    }

    localStorage.setItem("biofit_session", JSON.stringify(email));
    setUser(found);
    return { success: true, message: "로그인 성공!" };
  };

  const signup = (name: string, email: string, password: string): { success: boolean; message: string } => {
    const users = JSON.parse(localStorage.getItem("biofit_users") || "[]");
    const exists = users.some((u: any) => u.email === email);
    
    if (exists) {
      return { success: false, message: "이미 사용 중인 이메일 주소입니다." };
    }

    const newUser: User = { name, email, password };
    users.push(newUser);
    localStorage.setItem("biofit_users", JSON.stringify(users));
    localStorage.setItem("biofit_session", JSON.stringify(email));
    setUser(newUser);
    return { success: true, message: "회원가입이 완료되었습니다!" };
  };

  const logout = () => {
    localStorage.removeItem("biofit_session");
    setUser(null);
  };

  const saveUserData = (updatedFields: Partial<User>) => {
    if (!user) return;
    const users = JSON.parse(localStorage.getItem("biofit_users") || "[]");
    const updatedUsers = users.map((u: any) => {
      if (u.email === user.email) {
        return { ...u, ...updatedFields };
      }
      return u;
    });
    localStorage.setItem("biofit_users", JSON.stringify(updatedUsers));
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
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
