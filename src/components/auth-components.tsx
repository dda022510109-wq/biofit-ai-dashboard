import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, HeartPulse, Sparkles, User, Mail, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface AuthContainerProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  onSignup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
}

export function AuthContainer({ onLogin, onSignup }: AuthContainerProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup Form States
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await onLogin(loginEmail, loginPassword);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "로그인 처리 중 에러가 발생했습니다.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      toast.error("모든 필드를 입력해 주세요.");
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (signupPassword.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    setSignupLoading(true);
    try {
      const res = await onSignup(signupName, signupEmail, signupPassword);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || "회원가입 처리 중 에러가 발생했습니다.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Background Graphic Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px] space-y-6">
        {/* App Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-[0_0_35px_-4px_var(--color-primary)]">
            <Shield className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
            <HeartPulse className="absolute h-6 w-6 text-primary-foreground" strokeWidth={2.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              BioFit <span className="text-primary">AI</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              맞춤형 AI 안전 운동 처방 대시보드
            </p>
          </div>
        </div>

        {/* Card Component */}
        <Card className="border-border/60 bg-card/60 shadow-xl backdrop-blur-lg">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger value="login" className="text-xs sm:text-sm">로그인</TabsTrigger>
                <TabsTrigger value="signup" className="text-xs sm:text-sm">회원가입</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">이메일 주소</Label>
                    <div className="relative">
                      <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_0_30px_-6px_var(--color-primary)] transition-all hover:brightness-110"
                    disabled={loginLoading}
                  >
                    {loginLoading ? "로그인 중..." : "BioFit 시작하기"}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">이름</Label>
                    <div className="relative">
                      <User className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="홍길동"
                        className="pl-10"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">이메일 주소</Label>
                    <div className="relative">
                      <Mail className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="최소 6자 이상"
                        className="pl-10"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">비밀번호 확인</Label>
                    <div className="relative">
                      <CheckCircle2 className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="비밀번호 재입력"
                        className="pl-10"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_0_30px_-6px_var(--color-primary)] transition-all hover:brightness-110"
                    disabled={signupLoading}
                  >
                    {signupLoading ? "계정 생성 중..." : "회원가입 완료"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Core Principles Summary */}
        <div className="flex justify-center gap-6 text-center text-xs text-muted-foreground/80">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> AI 맞춤 분석
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-accent-foreground" /> 부상 ZERO 케어
          </span>
        </div>
      </div>
    </div>
  );
}
