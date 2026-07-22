import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HeartPulse,
  Shield,
  Volume2,
  VolumeX,
  Sparkles,
  Activity,
  Dumbbell,
  Timer,
  CalendarDays,
  User2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Target,
  ShieldCheck,
  Award,
  Sparkle,
  LogOut,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/use-auth";
import { AuthContainer } from "@/components/auth-components";

export const Route = createFileRoute("/")({
  component: BioFitApp,
});

/* ------------------------------- Types -------------------------------- */
type Gender = "여성" | "남성" | "기타";
type Activity =
  | "거의 없음 (좌식 생활)"
  | "가벼운 활동 (주 1~3회 가벼운 스포츠/걷기)"
  | "보통 활동 (주 3~5회 중강도 운동)"
  | "활발한 활동 (주 6~7회 고강도 운동)"
  | "매우 활발 (하루 2회 훈련/육체 노동)";
type Goal =
  | "체중 감량 & 군살 제거 (지방 연소 극대화)"
  | "근비대 & 근력 증가 (린 매스 빌드업)"
  | "체력 향상 & 지구력 (심폐 강화)"
  | "재활 & 자세 교정 (부상 방지)"
  | "컨디셔닝 & 유지 관리";

interface Metrics {
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  bodyFat?: number;
  muscle?: number;
  activity: Activity;
  goal: Goal;
}

interface Analysis {
  bmi: number;
  bmiLabel: string;
  bmr: number;
  tdee: number;
  bodyFat: number;
  muscle: number;
  fatMass: number;
  targetCalories: number;
  protein: number;
  riskScore: number; // 0-100
}

const activityFactor: Record<Activity, number> = {
  "거의 없음 (좌식 생활)": 1.2,
  "가벼운 활동 (주 1~3회 가벼운 스포츠/걷기)": 1.375,
  "보통 활동 (주 3~5회 중강도 운동)": 1.55,
  "활발한 활동 (주 6~7회 고강도 운동)": 1.725,
  "매우 활발 (하루 2회 훈련/육체 노동)": 1.9,
};

function analyze(m: Metrics): Analysis {
  const hM = m.height / 100;
  const bmi = m.weight / (hM * hM);
  const bmiLabel =
    bmi < 18.5 ? "저체중" : bmi < 23 ? "정상" : bmi < 25 ? "과체중" : bmi < 30 ? "비만" : "고도비만";
  // Mifflin-St Jeor
  const s = m.gender === "남성" ? 5 : -161;
  const bmr = Math.round(10 * m.weight + 6.25 * m.height - 5 * m.age + s);
  const tdee = Math.round(bmr * activityFactor[m.activity]);
  // Body fat estimate (Deurenberg) if missing
  const genderCoef = m.gender === "남성" ? 1 : 0;
  const estFat = 1.2 * bmi + 0.23 * m.age - 10.8 * genderCoef - 5.4;
  const bodyFat = m.bodyFat ?? Math.max(8, Math.min(45, +estFat.toFixed(1)));
  const fatMass = +(m.weight * (bodyFat / 100)).toFixed(1);
  const lean = m.weight - fatMass;
  const muscle = m.muscle ?? +(lean * 0.53).toFixed(1);
  const goalDelta = m.goal.startsWith("체중 감량") ? -450 : m.goal.startsWith("근비대") ? 250 : 0;
  const targetCalories = tdee + goalDelta;
  const proteinPerKg = m.goal.startsWith("근비대") ? 2.0 : m.goal.startsWith("체중 감량") ? 1.8 : 1.4;
  const protein = Math.round(m.weight * proteinPerKg);
  const risk = Math.max(
    5,
    Math.min(
      95,
      Math.round(
        (bodyFat > 30 ? 18 : 8) +
          (bmi > 28 ? 20 : bmi < 18.5 ? 15 : 6) +
          (m.age > 45 ? 20 : m.age > 30 ? 10 : 4) +
          (activityFactor[m.activity] < 1.4 ? 15 : 5),
      ),
    ),
  );
  return {
    bmi: +bmi.toFixed(1),
    bmiLabel,
    bmr,
    tdee,
    bodyFat,
    muscle,
    fatMass,
    targetCalories,
    protein,
    riskScore: risk,
  };
}

/* ------------------------------- Shell -------------------------------- */
function BioFitApp() {
  const { user, loading, login, signup, logout, saveUserData } = useAuth();
  
  const [tab, setTab] = useState("enroll");
  const [sound, setSound] = useState(true);
  
  const defaultMetrics: Metrics = {
    gender: "여성",
    age: 29,
    height: 162.5,
    weight: 58.2,
    activity: "가벼운 활동 (주 1~3회 가벼운 스포츠/걷기)",
    goal: "체중 감량 & 군살 제거 (지방 연소 극대화)",
  };

  const defaultDiary = [
    { date: "2026-07-11", workout: "인터벌 러닝", minutes: 32, calories: 312 },
    { date: "2026-07-12", workout: "코어 & 모빌리티", minutes: 25, calories: 180 },
    { date: "2026-07-13", workout: "휴식 (액티브 리커버리)", minutes: 15, calories: 65 },
    { date: "2026-07-14", workout: "전신 서킷", minutes: 40, calories: 402 },
  ];

  const [metrics, setMetrics] = useState<Metrics>(defaultMetrics);
  const [diary, setDiary] = useState<any[]>(defaultDiary);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // 유저 정보 로드 및 상태 복구
  useEffect(() => {
    if (user) {
      if (user.metrics) {
        setMetrics(user.metrics);
      } else {
        setMetrics(defaultMetrics);
      }
      if (user.diary) {
        setDiary(user.diary);
      } else {
        setDiary(defaultDiary);
      }
    }
  }, [user]);

  const handleAnalyze = () => {
    const a = analyze(metrics);
    setAnalysis(a);
    setTab("metabolic");
    if (sound) beep(880, 0.08);

    if (user) {
      saveUserData({ metrics });
    }

    toast.success("AI 분석이 완료되었습니다", {
      description: `BMI ${a.bmi} · TDEE ${a.tdee} kcal · 부상 위험 ${a.riskScore}%`,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">사용자 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AuthContainer onLogin={login} onSignup={signup} />
        <Toaster position="top-center" theme="dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BackgroundFX />
      <TopBar sound={sound} setSound={setSound} user={user} onLogout={logout} />
      <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-card/60 p-1 backdrop-blur sm:grid-cols-5">
            <TabTrigger value="enroll" icon={<User2 className="h-4 w-4" />} label="1. 신체 정보 입력" />
            <TabTrigger value="metabolic" icon={<Activity className="h-4 w-4" />} label="2. 신체 대사 분석" />
            <TabTrigger value="prescription" icon={<Dumbbell className="h-4 w-4" />} label="3. AI 안전 운동 처방전" />
            <TabTrigger value="timer" icon={<Timer className="h-4 w-4" />} label="4. 트레이닝 타이머" />
            <TabTrigger value="diary" icon={<CalendarDays className="h-4 w-4" />} label="5. 피트니스 다이어리" />
          </TabsList>

          <TabsContent value="enroll" className="mt-6">
            <EnrollTab metrics={metrics} setMetrics={setMetrics} onSubmit={handleAnalyze} />
          </TabsContent>
          <TabsContent value="metabolic" className="mt-6">
            <MetabolicTab metrics={metrics} analysis={analysis ?? analyze(metrics)} />
          </TabsContent>
          <TabsContent value="prescription" className="mt-6">
            <PrescriptionTab metrics={metrics} analysis={analysis ?? analyze(metrics)} />
          </TabsContent>
          <TabsContent value="timer" className="mt-6">
            <TimerTab sound={sound} />
          </TabsContent>
          <TabsContent value="diary" className="mt-6">
            <DiaryTab
              diary={diary}
              onAdd={(entry) => {
                const updatedDiary = [...diary, entry];
                setDiary(updatedDiary);
                if (user) {
                  saveUserData({ diary: updatedDiary });
                }
                if (sound) beep(660, 0.08);
                toast.success("세션이 다이어리에 기록되었습니다");
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-primary/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[140px]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

function TabTrigger({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium text-muted-foreground transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_24px_-6px_var(--color-primary)] sm:text-sm"
    >
      {icon}
      <span className="truncate">{label}</span>
    </TabsTrigger>
  );
}

/* ------------------------------- Top Bar ------------------------------ */
function TopBar({
  sound,
  setSound,
  user,
  onLogout,
}: {
  sound: boolean;
  setSound: (v: boolean) => void;
  user?: any;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[0_0_30px_-6px_var(--color-primary)]">
            <Shield className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
            <HeartPulse className="absolute h-5 w-5 text-primary-foreground" strokeWidth={2.75} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              BioFit <span className="text-primary">AI</span>
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              내 신체 메트릭 분석 및 맞춤형 AI 안전 운동 처방
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 md:flex">
            {sound ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">효과음</span>
            <Switch checked={sound} onCheckedChange={setSound} aria-label="효과음 켬/끔" />
          </div>
          <button
            className="md:hidden rounded-full border border-border/60 bg-card/60 p-2"
            onClick={() => setSound(!sound)}
            aria-label="효과음 토글"
          >
            {sound ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <Badge className="hidden gap-2 border-primary/30 bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/15 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-medium">AI 임상 모델 연동 완료</span>
          </Badge>

          {/* User Profile & Logout Button */}
          {user && (
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1.5 pl-4 backdrop-blur-md">
              <span className="text-xs font-semibold text-foreground/90 max-w-[80px] truncate">
                {user.name}님
              </span>
              <div className="h-3 w-px bg-border/80" />
              <button
                onClick={onLogout}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all"
                title="로그아웃"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* --------------------------- Tab 1: Enroll ---------------------------- */
function EnrollTab({
  metrics,
  setMetrics,
  onSubmit,
}: {
  metrics: Metrics;
  setMetrics: (m: Metrics) => void;
  onSubmit: () => void;
}) {
  const update = <K extends keyof Metrics>(k: K, v: Metrics[K]) => setMetrics({ ...metrics, [k]: v });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">신체 정보 입력</CardTitle>
          </div>
          <CardDescription>정확한 처방을 위해 아래 항목을 입력해주세요. 선택 항목은 AI가 자동으로 추정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="성별">
            <Select value={metrics.gender} onValueChange={(v) => update("gender", v as Gender)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="여성">여성</SelectItem>
                <SelectItem value="남성">남성</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="나이 (세)">
            <Input type="number" value={metrics.age} onChange={(e) => update("age", +e.target.value)} />
          </Field>
          <Field label="키 (cm)">
            <Input type="number" step="0.1" value={metrics.height} onChange={(e) => update("height", +e.target.value)} />
          </Field>
          <Field label="몸무게 (kg)">
            <Input type="number" step="0.1" value={metrics.weight} onChange={(e) => update("weight", +e.target.value)} />
          </Field>
          <Field label="체지방률 (%)" optional>
            <Input
              type="number"
              step="0.1"
              placeholder="미입력시 자동 추정 계산"
              value={metrics.bodyFat ?? ""}
              onChange={(e) => update("bodyFat", e.target.value ? +e.target.value : undefined)}
            />
          </Field>
          <Field label="골격근량 (kg)" optional>
            <Input
              type="number"
              step="0.1"
              placeholder="미입력시 자동 추정 계산"
              value={metrics.muscle ?? ""}
              onChange={(e) => update("muscle", e.target.value ? +e.target.value : undefined)}
            />
          </Field>
          <Field label="활동 수준" className="sm:col-span-2">
            <Select value={metrics.activity} onValueChange={(v) => update("activity", v as Activity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(activityFactor).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="핵심 피트니스 목표" className="sm:col-span-2">
            <Select value={metrics.goal} onValueChange={(v) => update("goal", v as Goal)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="체중 감량 & 군살 제거 (지방 연소 극대화)">체중 감량 & 군살 제거 (지방 연소 극대화)</SelectItem>
                <SelectItem value="근비대 & 근력 증가 (린 매스 빌드업)">근비대 & 근력 증가 (린 매스 빌드업)</SelectItem>
                <SelectItem value="체력 향상 & 지구력 (심폐 강화)">체력 향상 & 지구력 (심폐 강화)</SelectItem>
                <SelectItem value="재활 & 자세 교정 (부상 방지)">재활 & 자세 교정 (부상 방지)</SelectItem>
                <SelectItem value="컨디셔닝 & 유지 관리">컨디셔닝 & 유지 관리</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Button
              onClick={onSubmit}
              size="lg"
              className="group w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_0_40px_-8px_var(--color-primary)] hover:brightness-110"
            >
              <Sparkle className="h-5 w-5 transition-transform group-hover:rotate-12" />
              AI 대사 분석 & 안전 처방 생성
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              계산 완료 후 자동으로 "신체 대사 분석" 탭으로 이동합니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-card backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">부상 Zero 원칙</CardTitle>
            </div>
            <CardDescription>임상 프로토콜 기반의 안전 가이드</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "관절 안전 각도(ROM) 준수 — 무릎 90°, 어깨 외전 80° 이내",
              "웜업 8분 · 쿨다운 5분 자동 삽입",
              "심박존 Z2~Z4 이내로 심혈관 부담 최소화",
              "이전 세션 대비 볼륨 증가 +10% 상한",
            ].map((t) => (
              <div key={t} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground/90">{t}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[oklch(0.82_0.17_90)]" />
              <CardTitle className="text-base">AI DYNAMIC PRESCRIBING</CardTitle>
            </div>
            <CardDescription>Gemini-3.1-Flash 임상 모델 연동</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">근골격계 통증 리스크</span>
                <span className="font-semibold text-primary">실시간 계산</span>
              </div>
              <Progress value={22} className="h-1.5" />
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> 개인화 부하 곡선 자동 조정</li>
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> 세션마다 회복 지수 재계산</li>
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> 부상 이력 반영 안전 각도 처방</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  optional,
  className,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {label}
        {optional && <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">선택</span>}
      </Label>
      {children}
    </div>
  );
}

/* -------------------------- Tab 2: Metabolic -------------------------- */
function MetabolicTab({ metrics, analysis }: { metrics: Metrics; analysis: Analysis }) {
  const stats = [
    { label: "BMI", value: analysis.bmi.toFixed(1), sub: analysis.bmiLabel, icon: <Target className="h-4 w-4" />, tone: "primary" },
    { label: "BMR (기초 대사량)", value: `${analysis.bmr.toLocaleString()}`, sub: "kcal / 일", icon: <Flame className="h-4 w-4" />, tone: "accent" },
    { label: "TDEE (총 소모)", value: `${analysis.tdee.toLocaleString()}`, sub: "kcal / 일", icon: <Activity className="h-4 w-4" />, tone: "warn" },
    { label: "체지방 / 골격근", value: `${analysis.bodyFat.toFixed(1)}%`, sub: `근육 ${analysis.muscle}kg`, icon: <Award className="h-4 w-4" />, tone: "primary" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="relative overflow-hidden border-border/60 bg-card/70 backdrop-blur">
            <div className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl ${s.tone === "primary" ? "bg-primary/25" : s.tone === "accent" ? "bg-accent/25" : "bg-[oklch(0.82_0.17_90)]/25"}`} />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                {s.icon}
                <span className="text-xs font-medium">{s.label}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">심박존 & 트레이닝 강도 분포</CardTitle>
            <CardDescription>목표 "{metrics.goal}"에 최적화된 강도 배분</CardDescription>
          </CardHeader>
          <CardContent>
            <ZoneChart goal={metrics.goal} />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">일일 영양 처방</CardTitle>
            <CardDescription>목표 칼로리 {analysis.targetCalories.toLocaleString()} kcal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MacroBar label="단백질" value={analysis.protein} unit="g" color="bg-primary" pct={40} />
            <MacroBar label="탄수화물" value={Math.round(analysis.targetCalories * 0.45 / 4)} unit="g" color="bg-accent" pct={45} />
            <MacroBar label="지방" value={Math.round(analysis.targetCalories * 0.25 / 9)} unit="g" color="bg-[oklch(0.82_0.17_90)]" pct={25} />
            <Separator className="bg-border/60" />
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-[oklch(0.82_0.17_90)]" />
                근골격 리스크
              </div>
              <div className="text-lg font-semibold text-primary">{analysis.riskScore}%</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MacroBar({ label, value, unit, color, pct }: { label: string; value: number; unit: string; color: string; pct: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value} {unit}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/60">
        <div className={`h-full ${color} shadow-[0_0_18px_-2px_currentColor]`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ZoneChart({ goal }: { goal: Goal }) {
  // Weighted zone distribution per goal
  const zones =
    goal.startsWith("체력")
      ? [10, 25, 35, 20, 10]
      : goal.startsWith("근비대")
      ? [15, 35, 30, 15, 5]
      : goal.startsWith("재활")
      ? [40, 40, 15, 4, 1]
      : goal.startsWith("컨디셔닝")
      ? [25, 35, 25, 10, 5]
      : [15, 30, 35, 15, 5];
  const labels = ["Z1 회복", "Z2 유산소", "Z3 템포", "Z4 임계", "Z5 최대"];
  const colors = [
    "from-[oklch(0.68_0.17_235)]/70 to-[oklch(0.68_0.17_235)]",
    "from-primary/70 to-primary",
    "from-[oklch(0.82_0.17_90)]/70 to-[oklch(0.82_0.17_90)]",
    "from-[oklch(0.72_0.2_45)]/70 to-[oklch(0.72_0.2_45)]",
    "from-[oklch(0.65_0.22_25)]/70 to-[oklch(0.65_0.22_25)]",
  ];
  return (
    <div className="flex h-56 items-end gap-3">
      {zones.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="text-xs font-semibold text-foreground/80">{v}%</div>
          <div
            className={`w-full rounded-t-md bg-gradient-to-t ${colors[i]} transition-all duration-500`}
            style={{ height: `${v * 4 + 20}px` }}
          />
          <div className="text-[10px] font-medium text-muted-foreground sm:text-xs">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------ Tab 3: Prescription ------------------------- */
function PrescriptionTab({ metrics, analysis }: { metrics: Metrics; analysis: Analysis }) {
  const plan = useMemo(() => buildPlan(metrics), [metrics]);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card/80 backdrop-blur">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/40 bg-primary/15 text-primary">AI 처방</Badge>
              <CardTitle className="text-base">{metrics.goal}</CardTitle>
            </div>
            <CardDescription>
              활동 수준 · {metrics.activity} · TDEE {analysis.tdee.toLocaleString()} kcal
            </CardDescription>
          </CardHeader>
        </Card>

        {plan.map((day, idx) => (
          <Card key={idx} className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-sm font-bold text-primary">D{idx + 1}</div>
                  <CardTitle className="text-base">{day.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" /> {day.duration}분
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {day.exercises.map((ex) => (
                <div key={ex.name} className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{ex.name}</div>
                    {ex.desc && <div className="mt-0.5 text-xs text-muted-foreground">{ex.desc}</div>}
                    <div className="mt-1 text-xs text-muted-foreground/80 font-mono">{ex.sets}</div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 gap-1 border-primary/20 bg-primary/10 text-primary">
                    <ShieldCheck className="h-3 w-3" /> {ex.safe}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Warm-up / Cool-down 프로토콜</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ProtocolRow color="bg-accent" label="Dynamic Warm-up" time="8분" note="관절 가동 & 심박 상승" />
            <ProtocolRow color="bg-primary" label="Main Set" time="변동" note="Z2~Z3 유지" />
            <ProtocolRow color="bg-[oklch(0.82_0.17_90)]" label="Cool-down" time="5분" note="정적 스트레칭 & 호흡" />
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Safe Range 관절 각도</CardTitle>
            <CardDescription>부상 방지 각도 상한</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "무릎 굴곡", max: 90, unit: "°" },
              { label: "어깨 외전", max: 80, unit: "°" },
              { label: "허리 전굴", max: 45, unit: "°" },
              { label: "발목 배측굴곡", max: 20, unit: "°" },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold text-primary">≤ {r.max}{r.unit}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                  <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${(r.max / 120) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProtocolRow({ color, label, time, note }: { color: string; label: string; time: string; note: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
      <div className={`h-8 w-1.5 rounded-full ${color}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </div>
      <div className="shrink-0 text-xs font-semibold text-primary">{time}</div>
    </div>
  );
}

function buildPlan(m: Metrics) {
  const base = m.goal.startsWith("근비대")
    ? [
        { title: "상체 · 푸시 데이", duration: 55, exercises: [
          { name: "인클라인 덤벨 프레스", sets: "4 x 8-10 reps · 90s rest", safe: "어깨 ≤ 80°", desc: "윗가슴 타겟. 벤치를 30도 정도로 눕히고 덤벨을 수직으로 밀어 올립니다. 내릴 때 팔꿈치가 몸통 각도 80도 아래로 오도록 통제해 어깨 관절의 부담을 덜어주세요." },
          { name: "케이블 체스트 플라이", sets: "3 x 12 reps", safe: "가슴 스트레칭 제한", desc: "가슴 안쪽 타겟. 케이블을 둥근 궤적으로 가슴 중앙으로 모아줍니다. 팔을 이완시킬 때 손끝이 어깨 뒤쪽 라인으로 과도하게 넘어가지 않도록 통제하며 수행합니다." },
          { name: "오버헤드 트라이셉스", sets: "3 x 12 reps", safe: "팔꿈치 안정", desc: "삼두근 장두 강화. 덤벨이나 케이블 손잡이를 머리 뒤로 내릴 때 팔꿈치를 귀 양옆에 고정하고 벌어지지 않게 유지한 상태에서 아래팔만 위로 펴줍니다." },
        ]},
        { title: "하체 · 안전 스쿼트", duration: 60, exercises: [
          { name: "고블릿 스쿼트", sets: "4 x 10 reps · 120s rest", safe: "무릎 ≤ 90°", desc: "대퇴사두근 및 둔근 자극. 덤벨을 가슴 앞쪽에 타이트하게 쥐고 상체를 세워 척추 정렬을 유지합니다. 무릎이 발끝 방향을 향하도록 벌려주며 90도 까지만 내려갑니다." },
          { name: "루마니안 데드리프트", sets: "4 x 8 reps", safe: "허리 중립", desc: "후면 사슬(대퇴이두, 둔근, 기립근) 강화. 무릎을 가볍게 굽힌 채 골반을 뒤로 밀어내는 힙힌지를 활용합니다. 허리가 굽지 않는 범위까지만 바를 밀착해 내립니다." },
          { name: "레그 프레스", sets: "3 x 12 reps", safe: "가동 부분 사용", desc: "대퇴사두근 및 엉덩이 강화. 발판을 밀 때 무릎을 완전히 다 펴서 잠그지(Lock-out) 않고, 내릴 때 꼬리뼈가 발판 무게에 밀려 들리지 않도록 등받이에 골반을 밀착합니다." },
        ]},
        { title: "상체 · 풀 데이", duration: 50, exercises: [
          { name: "랫 풀다운", sets: "4 x 10 reps", safe: "견갑 하강", desc: "광배근 강화. 가슴을 쇄골 방향으로 하늘을 보듯 열어두고 바를 내릴 때 날개뼈를 먼저 하강시키며 팔꿈치를 옆구리 쪽으로 수직 견인합니다." },
          { name: "시티드 로우", sets: "3 x 12 reps", safe: "몸통 고정", desc: "등 중앙 및 능형근 타겟. 발을 지탱하고 몸통을 고정한 상태에서 손잡이를 아랫배 쪽으로 당깁니다. 날개뼈를 등 뒤로 접어 수축하고 어깨가 위로 솟지 않게 내립니다." },
          { name: "페이스 풀", sets: "3 x 15 reps", safe: "회전근개 강화", desc: "어깨 후면 및 회전근개 케어. 로프를 코/이마 방향으로 당기면서 양팔을 바깥으로 돌려 외회전시켜 줍니다. 승모근 개입을 줄이기 위해 팔꿈치 높이를 유지하세요." },
        ]},
      ]
    : m.goal.startsWith("체력")
    ? [
        { title: "인터벌 러닝", duration: 40, exercises: [
          { name: "웜업 조깅", sets: "8분 Z2", safe: "심박 65%", desc: "심장과 관절 웜업. 옆사람과 편안히 대화할 수 있는 가벼운 강도로 천천히 달리며 관절 활액 분비를 유도합니다." },
          { name: "1분 온 / 2분 오프 × 6", sets: "18분", safe: "Z4 상한", desc: "심폐 강화 및 체력 극대화. 1분 동안 전력 질주에 가까운 속도로 달린 뒤, 2분 동안은 가벼운 걷기나 느린 조깅으로 호흡을 다듬는 것을 6회 반복합니다." },
          { name: "쿨다운 워크", sets: "5분", safe: "Z1", desc: "회복 유도. 뜀걸음을 완전히 멈추지 않고 평보로 천천히 걸으며 심박수를 안전 영역으로 낮추고 하체에 쏠린 혈액 순환을 돕습니다." },
        ]},
        { title: "템포 라이드", duration: 45, exercises: [
          { name: "스테디 카디오", sets: "30분 Z2-Z3", safe: "대화 가능", desc: "지속성 심폐 운동. 실내 자전거 등 유산소 장비에서 땀이 송글송글 맺히고 숨이 차지만 대화는 유지할 수 있는 일정 템포를 지속합니다." },
          { name: "코어 서킷", sets: "10분", safe: "허리 중립", desc: "코어 안정화. 플랭크, 버드독 등으로 구성된 서킷. 운동 중 허리가 바닥으로 주저앉거나 과도하게 아치형으로 꺾이지 않도록 코어 텐션을 꽉 쥐어 유지합니다." },
        ]},
      ]
    : m.goal.startsWith("재활")
    ? [
        { title: "모빌리티 & 코어", duration: 30, exercises: [
          { name: "고관절 CARs", sets: "2 x 5 회전", safe: "통증 0", desc: "고관절 가동 범위 확대. 네발기기 자세 혹은 선 자세에서 한쪽 다리를 들어올려 안쪽/바깥쪽으로 원을 긋듯 천천히 돌립니다. 통증이 절대 없는 안전 영역 내에서만 수행합니다." },
          { name: "데드버그", sets: "3 x 10 reps", safe: "허리 밀착", desc: "골반 및 요추 안정화. 하늘을 보고 누워 팔다리를 교차하며 뻗습니다. 이때 동작 내내 허리가 바닥에서 뜨지 않도록 배꼽을 바닥 쪽으로 강하게 눌러줍니다." },
          { name: "글루트 브릿지", sets: "3 x 12 reps", safe: "골반 중립", desc: "둔근 활성화 및 허리 통증 개선. 등을 대고 누워 무릎을 굽힌 뒤 발뒤꿈치로 지면을 밀어 골반을 들어올립니다. 골반을 너무 높이 들어 허리가 꺾이지 않게 주의합니다." },
        ]},
        { title: "안전 근력 · 하체", duration: 35, exercises: [
          { name: "체어 스쿼트", sets: "3 x 10 reps", safe: "무릎 ≤ 60°", desc: "하체 기초 근력 회복. 의자 앞에 선 상태로 엉덩이를 의자 끝에 스치듯 내리며 앉았다가 발바닥 전체로 지면을 지탱하여 일어납니다. 무릎 굽힘을 최소화합니다." },
          { name: "월 슬라이드", sets: "3 x 8 reps", safe: "어깨 무통", desc: "어깨 안정성 강화. 벽에 기대어 등과 팔꿈치를 벽면에 밀착한 후 만세를 하듯 팔을 슬라이딩하며 올렸다 내립니다. 통증이 발생하는 지점 이전까지만 가동합니다." },
        ]},
      ]
    : [
        { title: "전신 지방 연소 서킷", duration: 45, exercises: [
          { name: "케틀벨 스윙", sets: "4 x 15 reps", safe: "허리 중립", desc: "전신 칼로리 연소. 둔근과 햄스트링의 폭발적인 힌지 팝을 이용하여 케틀벨을 밀어올립니다. 팔로 케틀벨을 당기는 것이 아니며 엉덩이 힘으로 튕겨내는 원리입니다." },
          { name: "런지 워크", sets: "3 x 20 걸음", safe: "무릎 ≤ 90°", desc: "하체 탄력 및 밸런스. 한 걸음씩 앞으로 걸어가며 앉아줍니다. 앞다리 무릎이 발끝보다 너무 앞으로 튀어나가지 않게 뒤꿈치에 체중을 싣고 각도를 90도 내로 조절합니다." },
          { name: "마운틴 클라이머", sets: "3 x 40초", safe: "어깨 고정", desc: "코어 및 고강도 유산소. 푸쉬업 자세에서 양다리를 교차하며 가슴 쪽으로 빠르게 당겨 올립니다. 상체가 흔들리지 않게 양손으로 바닥을 밀고 엉덩이 높이를 제어합니다." },
        ]},
        { title: "인터벌 유산소 (HIIT)", duration: 30, exercises: [
          { name: "타바타 × 4 라운드", sets: "20s 온 / 10s 오프", safe: "Z4 상한", desc: "단시간 고효율 체지방 연소. 버피나 스쿼트 점프 등의 전신 맨몸 운동을 20초간 한계치 속도로 수행한 후 10초간 완전 휴식하는 고강도 트레이닝입니다." },
          { name: "쿨다운 스트레칭", sets: "6분", safe: "정적 유지", desc: "근육 이완 및 진정. 격렬히 뭉친 하체와 척추 근육들을 늘려주는 요가/스트레칭 동작을 동작당 20~30초간 길게 유지하면서 깊은 호흡으로 근육을 이완시킵니다." },
        ]},
        { title: "액티브 리커버리", duration: 25, exercises: [
          { name: "빠르게 걷기", sets: "20분 Z2", safe: "심박 65%", desc: "피로 물질 제거 유산소. 가벼운 땀이 날 정도의 활기찬 걸음으로 일정 시간 걷습니다. 뛰지 않고 관절 충격을 피해 신진대사를 순환시키는 목적입니다." },
          { name: "폼롤링", sets: "5분", safe: "통증 회피", desc: "근막 자가 이완(SMR). 폼롤러를 허벅지, 종아리, 등 아래에 두고 천천히 체중을 실어 문질러 줍니다. 통증이 너무 심한 곳은 직접 압박하지 않고 주변부 위주로 풀어냅니다." },
        ]},
      ];
  return base;
}

/* ---------------------------- Tab 4: Timer ---------------------------- */
function TimerTab({ sound }: { sound: boolean }) {
  const [workSec, setWorkSec] = useState(30);
  const [restSec, setRestSec] = useState(15);
  const [rounds, setRounds] = useState(8);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        // switch phase
        if (phase === "work") {
          if (sound) beep(660, 0.12);
          setPhase("rest");
          return restSec;
        }
        if (round >= rounds) {
          if (sound) beep(990, 0.25);
          setRunning(false);
          setPhase("work");
          setRound(1);
          return workSec;
        }
        if (sound) beep(880, 0.12);
        setPhase("work");
        setRound((n) => n + 1);
        return workSec;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, round, workSec, restSec, rounds, sound]);

  const reset = () => {
    setRunning(false);
    setPhase("work");
    setRound(1);
    setRemaining(workSec);
  };

  const total = phase === "work" ? workSec : restSec;
  const pct = (remaining / total) * 100;
  const isWork = phase === "work";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Card className={`relative overflow-hidden border-border/60 bg-card/70 backdrop-blur transition-all ${isWork ? "shadow-[0_0_60px_-20px_var(--color-primary)]" : "shadow-[0_0_60px_-20px_var(--color-accent)]"}`}>
        <div className={`absolute inset-x-0 top-0 h-1 ${isWork ? "bg-primary" : "bg-accent"}`} />
        <CardContent className="flex flex-col items-center gap-6 py-12">
          <Badge className={`px-4 py-1.5 text-sm ${isWork ? "border-primary/40 bg-primary/15 text-primary" : "border-accent/40 bg-accent/15 text-accent-foreground"}`}>
            {isWork ? "🔥 운동 중" : "💧 휴식"}
          </Badge>
          <div className="relative grid h-64 w-64 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="46" strokeWidth="4" className="fill-none stroke-muted" />
              <circle
                cx="50" cy="50" r="46" strokeWidth="4" strokeLinecap="round"
                className={`fill-none transition-all duration-1000 ${isWork ? "stroke-primary" : "stroke-accent"}`}
                strokeDasharray={`${(pct / 100) * 289} 289`}
              />
            </svg>
            <div className="text-center">
              <div className="text-6xl font-bold tabular-nums tracking-tight">{String(remaining).padStart(2, "0")}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Round {round} / {rounds}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="lg" onClick={() => setRunning((r) => !r)} className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_0_30px_-8px_var(--color-primary)]">
              {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? "일시정지" : "시작"}
            </Button>
            <Button size="lg" variant="secondary" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" /> 리셋
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">인터벌 설정</CardTitle>
          <CardDescription>Tabata / HIIT 프리셋</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NumField label="운동 시간 (초)" value={workSec} onChange={(v) => { setWorkSec(v); if (phase === "work") setRemaining(v); }} />
          <NumField label="휴식 시간 (초)" value={restSec} onChange={(v) => { setRestSec(v); if (phase === "rest") setRemaining(v); }} />
          <NumField label="라운드 수" value={rounds} onChange={setRounds} />
          <Separator className="bg-border/60" />
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "Tabata", w: 20, r: 10, n: 8 },
              { name: "EMOM", w: 45, r: 15, n: 10 },
              { name: "HIIT", w: 40, r: 20, n: 6 },
            ].map((p) => (
              <Button key={p.name} variant="secondary" size="sm" onClick={() => { setWorkSec(p.w); setRestSec(p.r); setRounds(p.n); reset(); }}>
                {p.name}
              </Button>
            ))}
          </div>
          <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
            {sound ? "🔊 효과음이 활성화되어 각 페이즈 전환 시 알림음이 재생됩니다." : "🔇 효과음이 꺼져있습니다. 상단 헤더에서 활성화하세요."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="secondary" onClick={() => onChange(Math.max(1, value - 5))}>-</Button>
        <Input type="number" value={value} onChange={(e) => onChange(Math.max(1, +e.target.value))} className="text-center text-lg font-semibold" />
        <Button size="icon" variant="secondary" onClick={() => onChange(value + 5)}>+</Button>
      </div>
    </div>
  );
}

/* ---------------------------- Tab 5: Diary ---------------------------- */
function DiaryTab({
  diary,
  onAdd,
}: {
  diary: { date: string; workout: string; minutes: number; calories: number }[];
  onAdd: (e: { date: string; workout: string; minutes: number; calories: number }) => void;
}) {
  const [workout, setWorkout] = useState("전신 서킷");
  const [minutes, setMinutes] = useState(30);
  const totalMinutes = diary.reduce((s, d) => s + d.minutes, 0);
  const totalCalories = diary.reduce((s, d) => s + d.calories, 0);
  const streak = diary.length;

  const add = () => {
    const today = new Date().toISOString().slice(0, 10);
    onAdd({ date: today, workout, minutes, calories: Math.round(minutes * 9.5) });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Flame className="h-4 w-4" />} label="누적 칼로리" value={`${totalCalories.toLocaleString()} kcal`} />
          <StatCard icon={<Timer className="h-4 w-4" />} label="누적 운동 시간" value={`${totalMinutes} 분`} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="부상 Zero 스트릭" value={`${streak} 일`} tone="primary" />
        </div>

        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">최근 세션</CardTitle>
            <CardDescription>완료한 트레이닝 기록</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...diary].reverse().map((e, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{e.workout}</div>
                    <div className="text-xs text-muted-foreground">{e.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Badge variant="secondary" className="gap-1"><Timer className="h-3 w-3" />{e.minutes}분</Badge>
                  <Badge variant="secondary" className="gap-1 border-primary/20 bg-primary/10 text-primary"><Flame className="h-3 w-3" />{e.calories} kcal</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">세션 기록 추가</CardTitle>
          <CardDescription>오늘 완료한 운동을 저장하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">운동 종류</Label>
            <Select value={workout} onValueChange={setWorkout}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["전신 서킷", "인터벌 러닝", "상체 근력", "하체 근력", "모빌리티 & 코어", "액티브 리커버리"].map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NumField label="지속 시간 (분)" value={minutes} onChange={setMinutes} />
          <Button onClick={add} className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[0_0_30px_-8px_var(--color-primary)]">
            <CheckCircle2 className="h-4 w-4" /> 다이어리에 기록
          </Button>
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
            🏆 부상 없이 <b>{streak}일</b> 연속 훈련 중! AI 안전 프로토콜을 유지하세요.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "primary" }) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/70 backdrop-blur">
      {tone === "primary" && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />}
      <CardContent className="relative py-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Utilities ----------------------------- */
function beep(freq = 880, duration = 0.1) {
  if (typeof window === "undefined") return;
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, duration * 1000);
  } catch {
    // ignore
  }
}
