import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  GraduationCap,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { BorderBeam } from '../../components/magicui/border-beam';

export const AuthView: React.FC<{ initialMode?: 'login' | 'register' | 'forgot' }> = ({
  initialMode = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [role, setRole] = useState<'student' | 'instructor'>('student');

  // Distinct loading states to prevent universal button spinners
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [demoStudentLoading, setDemoStudentLoading] = useState(false);
  const [demoInstructorLoading, setDemoInstructorLoading] = useState(false);

  // Form input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Status feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email verification pending state
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { refreshProfile, signInDemo, user, activeRole, loading: authLoading } = useAuth();
  const { navigate, searchParams } = useRouter();

  const redirectUrl = searchParams.get('redirect');
  const isVerifiedParam = searchParams.get('verified') === '1';

  // Automatically redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      const target = redirectUrl || (activeRole === 'instructor' ? '/app/teach' : '/app/today');
      navigate(target);
    }
  }, [user, authLoading, activeRole, redirectUrl, navigate]);

  useEffect(() => {
    if (isVerifiedParam) {
      setSuccessMsg('E-posta adresiniz başarıyla doğrulandı! Şimdi şifrenizle giriş yapabilirsiniz.');
    }
  }, [isVerifiedParam]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Lütfen e-posta adresinizi ve şifrenizi giriniz.');
      return;
    }

    setLoginLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setPendingEmail(email.trim());
          setIsVerificationPending(true);
          setErrorMsg('Giriş yapabilmek için lütfen önce e-posta adresinize gönderilen doğrulama bağlantısını onaylayınız.');
        } else if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('E-posta adresi veya şifre hatalı. Lütfen kontrol edip tekrar deneyiniz.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      if (data?.user) {
        // Avoid stale closure by passing user.id directly
        const resolved = await refreshProfile(data.user.id);
        const destination = redirectUrl || (resolved.activeRole === 'instructor' ? '/app/teach' : '/app/today');
        navigate(destination);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Giriş işlemi sırasında bir hata oluştu.';
      setErrorMsg(message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Şifreniz en az 6 karakterden oluşmalıdır.');
      return;
    }

    setRegisterLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
          emailRedirectTo: `${window.location.origin}/auth/login?verified=1`,
        },
      });

      if (error) {
        if (
          error.message.includes('already registered') ||
          error.message.includes('already been registered') ||
          error.message.includes('Database error saving new user') ||
          error.message.includes('unique constraint') ||
          error.message.includes('users_email_partial_key')
        ) {
          setErrorMsg('Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır. Lütfen giriş yapınız.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      // Fire off Resend welcome transactional email in the background
      api.auth
        .sendWelcomeEmail({
          email: email.trim(),
          fullName: fullName.trim(),
          role,
        })
        .catch(() => {});

      if (data?.session) {
        // Auto-confirmed user (e.g. @cenna.live demo user)
        await api.auth.updateProfile({
          full_name: fullName.trim(),
          primary_role: role,
        });
        const resolved = await refreshProfile(data.user?.id);
        const destination = redirectUrl || (resolved.activeRole === 'instructor' ? '/app/teach' : '/app/today');
        navigate(destination);
      } else {
        // Email confirmation is required by Supabase GoTrue
        setPendingEmail(email.trim());
        setIsVerificationPending(true);
        setResendCooldown(60);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kayıt işlemi sırasında bir hata oluştu.';
      setErrorMsg(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  // Resend confirmation email
  const handleResendConfirmation = async () => {
    if (!pendingEmail || resendCooldown > 0) return;
    setResendLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login?verified=1`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol ediniz.');
        setResendCooldown(60);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Doğrulama iletisi gönderilemedi.';
      setErrorMsg(message);
    } finally {
      setResendLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Lütfen kayıtlı e-posta adresinizi giriniz.');
      return;
    }

    setForgotLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu kontrol ediniz.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Talep iletilemedi.';
      setErrorMsg(message);
    } finally {
      setForgotLoading(false);
    }
  };

  // Demo Login Handler
  const handleDemoSignIn = async (demoRole: 'student' | 'instructor') => {
    if (demoRole === 'student') setDemoStudentLoading(true);
    else setDemoInstructorLoading(true);
    setErrorMsg(null);

    try {
      const ok = await signInDemo(demoRole);
      if (ok) {
        const destination = redirectUrl || (demoRole === 'instructor' ? '/app/teach' : '/app/today');
        navigate(destination);
      } else {
        setErrorMsg(`Demo ${demoRole === 'instructor' ? 'eğitmen' : 'öğrenci'} girişi sağlanamadı.`);
      }
    } finally {
      if (demoRole === 'student') setDemoStudentLoading(false);
      else setDemoInstructorLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#060B14]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <BorderBeam size={220} duration={12} delay={9} colorFrom="#0EA5E9" colorTo="#10B981" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-black text-2xl shadow-lg shadow-sky-500/25 mb-3">
            C
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            CENNA<span className="text-sky-400">.live</span>'a Hoş Geldiniz
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Klinik Kurtarma Laboratuvarı & İlaç Tasarım Simülasyonu
          </p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs sm:text-sm text-rose-200">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs sm:text-sm text-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* View Mode 1: Verification Pending Screen */}
        {isVerificationPending ? (
          <div className="text-center space-y-5 animate-in fade-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Mail className="h-8 w-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">E-posta Doğrulaması Bekleniyor</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Hesabınızı etkinleştirmek için gereken doğrulama bağlantısı adresinize gönderildi:
              </p>
              <div className="inline-block rounded-lg bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 font-mono text-xs sm:text-sm text-sky-300">
                {pendingEmail}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <p>• Lütfen gelen kutunuzu ve spam klasörünüzü kontrol ediniz.</p>
              <p>• Gönderici adresi: <strong className="text-slate-200">bildirim@cenna.live</strong></p>
              <p>• E-postadaki butona tıkladıktan sonra doğrudan giriş yapabilirsiniz.</p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                variant="outline"
                className="w-full text-xs sm:text-sm"
                onClick={handleResendConfirmation}
                disabled={resendLoading || resendCooldown > 0}
              >
                {resendLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {resendCooldown > 0
                  ? `Tekrar Gönder (${resendCooldown}s)`
                  : 'Doğrulama E-postasını Tekrar Gönder'}
              </Button>

              <Button
                variant="ghost"
                className="w-full text-xs text-slate-400 hover:text-white"
                onClick={() => {
                  setIsVerificationPending(false);
                  setActiveTab('login');
                }}
              >
                Giriş Ekranına Dön
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode 2: Tabs (Login / Register / Forgot) */
          <div>
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'login'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'register'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            {/* TAB 1: LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Kurumsal E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ad.soyad@universite.edu.tr"
                      required
                      className="pl-9 bg-slate-950/80 border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Şifre</label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot');
                        setErrorMsg(null);
                      }}
                      className="text-xs text-sky-400 hover:text-sky-300 hover:underline"
                    >
                      Şifrenizi mi unuttunuz?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pl-9 bg-slate-950/80 border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-11 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-blue-500 mt-2"
                >
                  {loginLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Laboratuvara Giriş Yap
                </Button>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Ad Soyad / Unvan
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ecz. Ayşe Yılmaz veya Dr. Mehmet Kaya"
                      required
                      className="pl-9 bg-slate-950/80 border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Kurumsal E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ad.soyad@universite.edu.tr"
                      required
                      className="pl-9 bg-slate-950/80 border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      required
                      className="pl-9 bg-slate-950/80 border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                {/* Role Selection Cards */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-semibold text-slate-300">Hesap Rolü</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        role === 'student'
                          ? 'border-sky-500 bg-sky-500/10 text-white shadow-sm shadow-sky-500/20'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <GraduationCap className={`h-5 w-5 mb-1.5 ${role === 'student' ? 'text-sky-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">Öğrenci</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">21 Görev & Laboratuvar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('instructor')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        role === 'instructor'
                          ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm shadow-emerald-500/20'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <FlaskConical className={`h-5 w-5 mb-1.5 ${role === 'instructor' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">Eğitmen</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Sınıflar & PDF Analiz</span>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 mt-2"
                >
                  {registerLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Hesap Oluştur ve Başla
                </Button>
              </form>
            )}

            {/* TAB 3: FORGOT PASSWORD */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kayıtlı e-posta adresinizi girin. Şifrenizi güvenle yenilemeniz için tek kullanımlık bir bağlantı ileteceğiz.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Kurumsal E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ad.soyad@universite.edu.tr"
                      required
                      className="pl-9 bg-slate-950/80 border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full h-11 bg-slate-800 text-white font-semibold text-sm border border-slate-700 hover:bg-slate-700 mt-2"
                >
                  {forgotLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sıfırlama Bağlantısı Gönder
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Giriş Ekranına Dön
                  </button>
                </div>
              </form>
            )}

            {/* Quick Demo Sandbox Access Bar */}
            <div className="relative mt-8 pt-6 border-t border-slate-800">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                1-Tıkla Canlı Değerlendirme Sandbox'ı
              </div>

              <div className="space-y-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('student')}
                  disabled={demoStudentLoading || demoInstructorLoading}
                  className="w-full flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-slate-300 hover:border-sky-500/50 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    {demoStudentLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-sky-400" />
                    )}
                    <span className="font-semibold">Demo Öğrenci Olarak Giriş Yap</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-sky-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSignIn('instructor')}
                  disabled={demoStudentLoading || demoInstructorLoading}
                  className="w-full flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-white transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    {demoInstructorLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                    )}
                    <span className="font-semibold">Demo Eğitmen Olarak Giriş Yap</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
