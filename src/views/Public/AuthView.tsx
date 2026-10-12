import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Alert, Typography, Radio, Space, Divider } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  RocketOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Text, Paragraph } = Typography;

export const AuthView: React.FC<{ initialMode?: 'login' | 'register' | 'forgot' }> = ({ initialMode = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { refreshProfile, signInDemo, activeRole } = useAuth();
  const { navigate } = useRouter();

  // Login handler
  const handleLogin = async (values: any) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data?.user) {
        await refreshProfile();
        navigate(activeRole === 'instructor' ? '/app/teach' : '/app/today');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Giriş işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (values: any) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: values.role,
          },
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
          setErrorMsg('Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır. Lütfen giriş yapmayı deneyin.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      if (data?.user) {
        // Update user profile in backend
        await api.auth.updateProfile({
          full_name: values.fullName,
          primary_role: values.role,
        });

        setSuccessMsg(
          'Hesabınız başarıyla oluşturuldu ve doğrulandı! Belirlediğiniz şifre ile hemen giriş yapabilirsiniz.'
        );
        setActiveTab('login');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Kayıt işlemi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async (values: any) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
        redirectTo: `${window.location.origin}/auth/login`,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Şifre sıfırlama talebi başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Helper
  const handleDemoSignIn = async (role: 'student' | 'instructor') => {
    setLoading(true);
    setErrorMsg(null);
    const ok = await signInDemo(role);
    setLoading(false);
    if (ok) {
      navigate(role === 'instructor' ? '/app/teach' : '/app/today');
    } else {
      setErrorMsg(`Demo ${role === 'instructor' ? 'eğitmen' : 'öğrenci'} girişi sağlanamadı.`);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        backgroundColor: '#F8FAFC',
      }}
    >
      <Card
        bordered
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 16,
          borderColor: '#E2E8F0',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#2563EB',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: 22,
              marginBottom: 12,
            }}
          >
            C
          </div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, fontSize: 24, color: '#0F172A' }}>
            CENNA<span style={{ color: '#2563EB' }}>.live</span>'a Hoş Geldiniz
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Aktif Hatırlama ve Bilinçli Pratik Platformu
          </Text>
        </div>

        {errorMsg && (
          <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
        )}
        {successMsg && (
          <Alert message={successMsg} type="success" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={(k) => {
            setActiveTab(k as any);
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          centered
          items={[
            {
              key: 'login',
              label: 'Giriş Yap',
              children: (
                <Form layout="vertical" onFinish={handleLogin} style={{ marginTop: 8 }}>
                  <Form.Item
                    name="email"
                    label="Kurumsal E-posta Adresi"
                    rules={[{ required: true, type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }]}
                  >
                    <Input prefix={<MailOutlined style={{ color: '#94A3B8' }} />} placeholder="ad.soyad@universite.edu.tr" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Şifre"
                    rules={[{ required: true, message: 'Lütfen şifrenizi giriniz' }]}
                  >
                    <Input.Password prefix={<LockOutlined style={{ color: '#94A3B8' }} />} placeholder="••••••••" size="large" />
                  </Form.Item>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <Button type="link" size="small" onClick={() => setActiveTab('forgot')} style={{ padding: 0 }}>
                      Şifrenizi mi unuttunuz?
                    </Button>
                  </div>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    style={{ backgroundColor: '#2563EB', fontWeight: 600, height: 44, borderRadius: 8 }}
                  >
                    Giriş Yap
                  </Button>
                </Form>
              ),
            },
            {
              key: 'register',
              label: 'Kayıt Ol',
              children: (
                <Form
                  layout="vertical"
                  onFinish={handleRegister}
                  initialValues={{ role: 'student' }}
                  style={{ marginTop: 8 }}
                >
                  <Form.Item
                    name="fullName"
                    label="Ad Soyad / Unvan"
                    rules={[{ required: true, message: 'Lütfen adınızı ve soyadınızı giriniz' }]}
                  >
                    <Input prefix={<UserOutlined style={{ color: '#94A3B8' }} />} placeholder="Prof. Dr. Ahmet Yılmaz veya Ecz. Ayşe Kaya" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Kurumsal E-posta Adresi"
                    rules={[{ required: true, type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }]}
                  >
                    <Input prefix={<MailOutlined style={{ color: '#94A3B8' }} />} placeholder="ad.soyad@universite.edu.tr" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Şifre"
                    rules={[{ required: true, min: 6, message: 'Şifre en az 6 karakter olmalıdır' }]}
                  >
                    <Input.Password prefix={<LockOutlined style={{ color: '#94A3B8' }} />} placeholder="••••••••" size="large" />
                  </Form.Item>

                  <Form.Item name="role" label="Hesap Türü" rules={[{ required: true }]}>
                    <Radio.Group style={{ width: '100%', display: 'flex', gap: 12 }}>
                      <Radio.Button value="student" style={{ flex: 1, textAlign: 'center', height: 40, lineHeight: '38px' }}>
                        Öğrenci
                      </Radio.Button>
                      <Radio.Button value="instructor" style={{ flex: 1, textAlign: 'center', height: 40, lineHeight: '38px' }}>
                        Eğitmen
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    style={{ backgroundColor: '#2563EB', fontWeight: 600, height: 44, borderRadius: 8, marginTop: 8 }}
                  >
                    Hesap Oluştur
                  </Button>
                </Form>
              ),
            },
            {
              key: 'forgot',
              label: 'Şifremi Sıfırla',
              children: (
                <Form layout="vertical" onFinish={handleForgotPassword} style={{ marginTop: 8 }}>
                  <Paragraph style={{ fontSize: 13, color: '#64748B' }}>
                    Kayıtlı kurumsal e-posta adresinizi girin. Şifrenizi sıfırlamanız için güvenli bir bağlantı göndereceğiz.
                  </Paragraph>
                  <Form.Item
                    name="email"
                    label="Kurumsal E-posta Adresi"
                    rules={[{ required: true, type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }]}
                  >
                    <Input prefix={<MailOutlined style={{ color: '#94A3B8' }} />} placeholder="ad.soyad@universite.edu.tr" size="large" />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    style={{ backgroundColor: '#2563EB', fontWeight: 600, height: 44, borderRadius: 8 }}
                  >
                    Sıfırlama Bağlantısı Gönder
                  </Button>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Button type="link" size="small" onClick={() => setActiveTab('login')}>
                      Giriş Ekranına Dön
                    </Button>
                  </div>
                </Form>
              ),
            },
          ]}
        />

        {/* Quick Demo Access Bar */}
        <Divider style={{ margin: '20px 0 16px 0', fontSize: 12, color: '#94A3B8' }}>
          Hızlı Demo Girişi (Değerlendirme)
        </Divider>

        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Button
            block
            icon={<RocketOutlined style={{ color: '#2563EB' }} />}
            onClick={() => handleDemoSignIn('student')}
            loading={loading}
            style={{ borderRadius: 8, height: 38, fontWeight: 500 }}
          >
            Demo Öğrenci Olarak Giriş Yap
          </Button>
          <Button
            block
            icon={<TeamOutlined style={{ color: '#7C3AED' }} />}
            onClick={() => handleDemoSignIn('instructor')}
            loading={loading}
            style={{ borderRadius: 8, height: 38, fontWeight: 500 }}
          >
            Demo Eğitmen Olarak Giriş Yap
          </Button>
        </Space>
      </Card>
    </div>
  );
};
