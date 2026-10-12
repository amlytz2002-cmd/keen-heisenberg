import React, { useState } from 'react';
import { Button, Drawer, Dropdown, MenuProps, Tag, Space } from 'antd';
import {
  MenuOutlined,
  BookOutlined,
  CalendarOutlined,
  HistoryOutlined,
  FormOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  LogoutOutlined,
  SwapOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { useMicrolearning } from '../context/MicrolearningContext';
import { StreakBadge } from './gamification/StreakBadge';

export const Navbar: React.FC = () => {
  const { user, profile, activeRole, setActiveRole, signOut } = useAuth();
  const { path, navigate } = useRouter();
  const { gamification } = useMicrolearning();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isInstructor = (Array.isArray(profile?.roles) && profile.roles.includes('instructor')) || profile?.primary_role === 'instructor' || activeRole === 'instructor';
  const isAdmin = (Array.isArray(profile?.roles) && profile.roles.includes('admin')) || profile?.primary_role === 'admin' || activeRole === 'admin';

  const getRoleBadgeConfig = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: 'YÖNETİCİ', color: 'red' };
      case 'instructor':
        return { label: 'EĞİTMEN', color: 'purple' };
      case 'student':
      default:
        return { label: 'ÖĞRENCİ', color: 'blue' };
    }
  };

  const roleBadgeConfig = getRoleBadgeConfig(activeRole);

  const handleRoleToggle = () => {
    const nextRole = activeRole === 'student' ? 'instructor' : 'student';
    setActiveRole(nextRole);
    if (nextRole === 'instructor') {
      navigate('/app/teach');
    } else {
      navigate('/app/today');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user_info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{profile?.full_name || 'Kullanıcı'}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>{user?.email}</div>
          <div style={{ marginTop: 4 }}>
            <Tag color={roleBadgeConfig.color}>
              {roleBadgeConfig.label}
            </Tag>
          </div>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'my_profile',
      icon: <UserOutlined />,
      label: 'Profilim',
      onClick: () => {
        if (activeRole === 'instructor') {
          navigate('/app/teach');
        } else {
          navigate('/app/progress');
        }
      },
    },
    ...(isInstructor
      ? [
          {
            key: 'switch_role',
            icon: <SwapOutlined />,
            label: activeRole === 'student' ? 'Eğitmen Görünümüne Geç' : 'Öğrenci Görünümüne Geç',
            onClick: handleRoleToggle,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            key: 'admin_audit',
            icon: <SafetyCertificateOutlined />,
            label: 'Sistem Denetim Kayıtları',
            onClick: () => navigate('/app/admin/audit'),
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'sign_out',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Oturumu Kapat',
      onClick: async () => {
        await signOut();
        navigate('/');
      },
    },
  ];

  const studentNavItems = [
    { label: 'Klinik Laboratuvar', path: '/learn', icon: <ExperimentOutlined /> },
    { label: 'Bugün', path: '/app/today', icon: <CalendarOutlined /> },
    { label: 'Aralıklı Tekrar', path: '/app/review', icon: <HistoryOutlined /> },
    { label: 'Süreli Sınavlar', path: '/app/exams', icon: <FormOutlined /> },
    { label: 'Gelişim & İlerleme', path: '/app/progress', icon: <LineChartOutlined /> },
  ];

  const instructorNavItems = [
    { label: 'Eğitmen Paneli', path: '/app/teach', icon: <BookOutlined /> },
    { label: 'Sınıf Yönetimi', path: '/app/teach/classrooms', icon: <TeamOutlined /> },
    { label: 'Dersler', path: '/app/teach/courses', icon: <AppstoreOutlined /> },
    { label: 'Belgeler & Kaynaklar', path: '/app/teach/resources', icon: <FileTextOutlined /> },
    { label: 'İçerik İnceleme', path: '/app/teach/content-review', icon: <CheckCircleOutlined /> },
    { label: 'Analitik', path: '/app/teach/analytics', icon: <LineChartOutlined /> },
  ];

  const currentNavItems = activeRole === 'instructor' ? instructorNavItems : studentNavItems;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 16px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <div
          onClick={() => navigate(user ? (activeRole === 'instructor' ? '/app/teach' : '/learn') : '/')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 20,
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
            }}
          >
            C
          </div>
          <div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
              CENNA
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#2563EB', marginLeft: 1 }}>.live</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div style={{ display: 'none', alignItems: 'center', gap: 6 }} className="desktop-nav">
          {user ? (
            <>
              {currentNavItems.map((item) => {
                const isActive = path.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                      color: isActive ? '#2563EB' : '#475569',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/features')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: path === '/features' ? '#EFF6FF' : 'transparent',
                  color: path === '/features' ? '#2563EB' : '#475569',
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Özellikler
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: path === '/how-it-works' ? '#EFF6FF' : 'transparent',
                  color: path === '/how-it-works' ? '#2563EB' : '#475569',
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Eğitim Metodu & Pedagoji
              </button>
            </>
          )}
        </div>

        {/* Right CTA / User controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              {isInstructor && (
                <Button
                  size="small"
                  type="text"
                  icon={<SwapOutlined />}
                  onClick={handleRoleToggle}
                  style={{
                    display: 'none',
                    borderRadius: 6,
                    color: '#64748B',
                    fontSize: 12,
                  }}
                  className="desktop-nav"
                >
                  {activeRole === 'student' ? 'Eğitmen Görünümü' : 'Öğrenci Görünümü'}
                </Button>
              )}

              <div className="desktop-nav">
                <StreakBadge streak={gamification.streak} xp={gamification.xp} />
              </div>

              <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                <Button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 20,
                    padding: '4px 12px',
                    borderColor: '#E2E8F0',
                  }}
                >
                  <UserOutlined style={{ color: '#2563EB' }} />
                  <span
                    style={{
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {profile?.full_name?.split(' ')[0] || 'Profilim'}
                  </span>
                </Button>
              </Dropdown>
            </>
          ) : (
            <Space>
              <Button
                type="text"
                onClick={() => navigate('/auth/login')}
                style={{ fontWeight: 600, color: '#334155' }}
              >
                Giriş Yap
              </Button>
              <Button
                type="primary"
                onClick={() => navigate('/auth/register')}
                style={{
                  backgroundColor: '#2563EB',
                  fontWeight: 600,
                  boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                }}
              >
                Hemen Başla
              </Button>
            </Space>
          )}

          {/* Mobile hamburger button */}
          <Button
            type="text"
            aria-label="Gezinme Menüsünü Aç"
            icon={<MenuOutlined style={{ fontSize: 18, color: '#1E293B' }} />}
            onClick={() => setMobileMenuOpen(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className="mobile-hamburger"
          />
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, color: '#0F172A' }}>CENNA.live</span>
            {user && (
              <Tag color={roleBadgeConfig.color}>
                {roleBadgeConfig.label}
              </Tag>
            )}
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {user ? (
            <>
              {isInstructor && (
                <div style={{ marginBottom: 12 }}>
                  <Button
                    block
                    icon={<SwapOutlined />}
                    onClick={() => {
                      handleRoleToggle();
                      setMobileMenuOpen(false);
                    }}
                  >
                    {activeRole === 'student' ? 'Eğitmen Görünümüne Geç' : 'Öğrenci Görünümüne Geç'}
                  </Button>
                </div>
              )}

              {currentNavItems.map((item) => (
                <Button
                  key={item.path}
                  block
                  type={path.startsWith(item.path) ? 'primary' : 'text'}
                  icon={item.icon}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    height: 44,
                    fontSize: 15,
                  }}
                >
                  {item.label}
                </Button>
              ))}

              <div style={{ margin: '16px 0', borderTop: '1px solid #E2E8F0' }} />

              <Button
                danger
                block
                icon={<LogoutOutlined />}
                onClick={async () => {
                  await signOut();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
              >
                Oturumu Kapat
              </Button>
            </>
          ) : (
            <>
              <Button
                block
                type="text"
                onClick={() => {
                  navigate('/');
                  setMobileMenuOpen(false);
                }}
                style={{ textAlign: 'left', height: 44 }}
              >
                Ana Sayfa
              </Button>
              <Button
                block
                type="text"
                onClick={() => {
                  navigate('/features');
                  setMobileMenuOpen(false);
                }}
                style={{ textAlign: 'left', height: 44 }}
              >
                Özellikler
              </Button>
              <Button
                block
                type="text"
                onClick={() => {
                  navigate('/how-it-works');
                  setMobileMenuOpen(false);
                }}
                style={{ textAlign: 'left', height: 44 }}
              >
                Eğitim Metodu & Pedagoji
              </Button>
              <Button
                block
                type="text"
                onClick={() => {
                  navigate('/privacy');
                  setMobileMenuOpen(false);
                }}
                style={{ textAlign: 'left', height: 44 }}
              >
                Gizlilik Politikası
              </Button>
              <Button
                block
                type="text"
                onClick={() => {
                  navigate('/terms');
                  setMobileMenuOpen(false);
                }}
                style={{ textAlign: 'left', height: 44 }}
              >
                Kullanım Koşulları
              </Button>

              <div style={{ margin: '16px 0', borderTop: '1px solid #E2E8F0' }} />

              <Button
                block
                type="primary"
                onClick={() => {
                  navigate('/auth/login');
                  setMobileMenuOpen(false);
                }}
                style={{ height: 44 }}
              >
                Giriş Yap
              </Button>
              <Button
                block
                onClick={() => {
                  navigate('/auth/register');
                  setMobileMenuOpen(false);
                }}
                style={{ height: 44 }}
              >
                Hemen Başla
              </Button>
            </>
          )}
        </div>
      </Drawer>

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-hamburger {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
