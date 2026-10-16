import React, { useState } from 'react';
import {
  Menu,
  BookOpen,
  Calendar,
  History,
  FileText,
  TrendingUp,
  ShieldCheck,
  User,
  LogOut,
  RefreshCw,
  FlaskConical,
  Sparkles,
  Users,
  BarChart3,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useMicrolearning } from '../context/MicrolearningContext';
import { StreakBadge } from './gamification/StreakBadge';
import { Sheet } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export const Navbar: React.FC = () => {
  const { user, profile, activeRole, setActiveRole, signOut } = useAuth();
  const { path, navigate } = useRouter();
  const { gamification } = useMicrolearning();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isInstructor =
    (Array.isArray(profile?.roles) && profile.roles.includes('instructor')) ||
    profile?.primary_role === 'instructor' ||
    activeRole === 'instructor';

  const isAdmin =
    (Array.isArray(profile?.roles) && profile.roles.includes('admin')) ||
    profile?.primary_role === 'admin' ||
    activeRole === 'admin';

  const handleRoleToggle = () => {
    const nextRole: UserRole = activeRole === 'student' ? 'instructor' : 'student';
    setActiveRole(nextRole);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    if (nextRole === 'instructor') {
      navigate('/app/teach');
    } else {
      navigate('/app/today');
    }
  };

  const studentNavItems = [
    { label: 'Müfredat & Görevler', path: '/learn', icon: BookOpen },
    { label: 'Bugün', path: '/app/today', icon: Calendar },
    { label: 'Sınıflarım', path: '/app/classrooms', icon: Users },
    { label: 'Aralıklı Tekrar', path: '/app/review', icon: History },
    { label: 'Sınavlar', path: '/app/exams', icon: FileText },
    { label: 'Gelişim', path: '/app/progress', icon: TrendingUp },
  ];

  const instructorNavItems = [
    { label: 'Eğitmen Paneli', path: '/app/teach', icon: FlaskConical },
    { label: 'Sınıf Yönetimi', path: '/app/teach/classrooms', icon: Users },
    { label: 'Dersler', path: '/app/teach/courses', icon: BookOpen },
    { label: 'Belgeler', path: '/app/teach/resources', icon: FolderOpen },
    { label: 'İçerik İnceleme', path: '/app/teach/content-review', icon: CheckCircle2 },
    { label: 'Analitik', path: '/app/teach/analytics', icon: BarChart3 },
  ];

  const currentNavItems = activeRole === 'instructor' ? instructorNavItems : studentNavItems;

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#060B14]/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => navigate('/')}
          className="cursor-pointer flex items-center gap-3 select-none group"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
            C
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-black text-white tracking-tight">CENNA</span>
            <span className="text-lg font-bold text-sky-400">.live</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {user ? (
            currentNavItems.map((item) => {
              const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/features')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  path === '/features'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                Özellikler
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  path === '/how-it-works'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                Eğitim Metodu & Pedagoji
              </button>
            </div>
          )}
        </nav>

        {/* Right Actions & User Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* If on home cover page, render quick dashboard return button */}
              {(path === '/' || path === '') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(activeRole === 'instructor' ? '/app/teach' : '/app/today')}
                  className="hidden sm:inline-flex text-xs border-sky-500/40 text-sky-300 hover:bg-sky-500/10"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-sky-400" />
                  {activeRole === 'instructor' ? 'Eğitmen Paneline Dön' : 'Laboratuvara Dön'}
                </Button>
              )}

              {/* Role Toggle Button */}
              {isInstructor && (
                <button
                  type="button"
                  onClick={handleRoleToggle}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                  title="Öğrenci / Eğitmen Rol Değişimi"
                >
                  <RefreshCw className="h-3 w-3 text-sky-400" />
                  <span>{activeRole === 'student' ? 'Eğitmen Görünümü' : 'Öğrenci Görünümü'}</span>
                </button>
              )}

              {/* Gamification Streak & XP */}
              {activeRole === 'student' && (
                <div className="hidden sm:block">
                  <StreakBadge streak={gamification.streak} xp={gamification.xp} compact />
                </div>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-500/50 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <div className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[100px] truncate hidden sm:inline-block">
                    {profile?.full_name?.split(' ')[0] || 'Hesabım'}
                  </span>
                  <Badge variant={activeRole === 'instructor' ? 'purple' : 'default'} className="text-[10px] py-0 px-1.5">
                    {activeRole === 'instructor' ? 'EĞİTMEN' : 'ÖĞRENCİ'}
                  </Badge>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="text-xs font-bold text-white truncate">{profile?.full_name || 'Kullanıcı'}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate(activeRole === 'instructor' ? '/app/teach' : '/app/progress');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                      >
                        <User className="h-3.5 w-3.5 text-sky-400" />
                        <span>Profil ve İlerleme</span>
                      </button>

                      {isInstructor && (
                        <button
                          onClick={handleRoleToggle}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-purple-400" />
                          <span>{activeRole === 'student' ? 'Eğitmen Görünümü' : 'Öğrenci Görünümü'}</span>
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate('/app/admin/audit');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Sistem Denetim Logları</span>
                        </button>
                      )}

                      <div className="border-t border-slate-800 my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors text-left"
                      >
                        <LogOut className="h-3.5 w-3.5 text-rose-400" />
                        <span>Oturumu Kapat</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/auth/login')}
                className="text-xs text-slate-300 hover:text-white"
              >
                Giriş Yap
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/auth/register')}
                className="text-xs bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500"
              >
                Hemen Başla
              </Button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Gezinme Menüsünü Aç"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Sheet */}
      <Sheet
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        side="right"
        title="CENNA.live Gezinme"
      >
        <div className="flex flex-col h-full justify-between space-y-6">
          <div className="space-y-4">
            {user && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{profile?.full_name || 'Kullanıcı'}</span>
                  <Badge variant={activeRole === 'instructor' ? 'purple' : 'default'} className="text-[10px]">
                    {activeRole === 'instructor' ? 'EĞİTMEN' : 'ÖĞRENCİ'}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">{user.email}</p>
                {activeRole === 'student' && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <StreakBadge streak={gamification.streak} xp={gamification.xp} compact />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
                Sayfalar
              </div>
              {user ? (
                currentNavItems.map((item) => {
                  const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(item.path);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900 text-left"
                  >
                    <BookOpen className="h-4 w-4 text-sky-400" />
                    <span>Ana Sayfa</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/features');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900 text-left"
                  >
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    <span>Özellikler</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/how-it-works');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900 text-left"
                  >
                    <FlaskConical className="h-4 w-4 text-emerald-400" />
                    <span>Eğitim Metodu</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Footer Actions */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {user ? (
              <>
                {isInstructor && (
                  <Button
                    variant="outline"
                    className="w-full text-xs justify-center"
                    onClick={handleRoleToggle}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    {activeRole === 'student' ? 'Eğitmen Görünümüne Geç' : 'Öğrenci Görünümüne Geç'}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full text-xs justify-center"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Oturumu Kapat
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/auth/login');
                  }}
                >
                  Giriş Yap
                </Button>
                <Button
                  className="text-xs bg-sky-500 hover:bg-sky-400 text-white"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/auth/register');
                  }}
                >
                  Hemen Başla
                </Button>
              </div>
            )}
          </div>
        </div>
      </Sheet>
    </header>
  );
};
