import React, { useEffect, useState } from 'react';
import { Card, Result, Button, Spin, Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

const { Title, Paragraph } = Typography;

export const InviteRedeemView: React.FC = () => {
  const { params, navigate } = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [classroomData, setClassroomData] = useState<any>(null);

  const token = params.token;

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus('error');
      setErrorMessage('Geçersiz veya eksik davet bağlantısı.');
      return;
    }

    if (!user) {
      // Must authenticate first
      return;
    }

    const redeem = async () => {
      setLoading(true);
      const res = await api.classrooms.redeemInvitation(token);
      setLoading(false);
      if (res.success) {
        setStatus('success');
        setClassroomData(res.data);
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'Davet kodu doğrulanamadı veya süresi dolmuş.');
      }
    };

    redeem();
  }, [token, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Sınıf daveti doğrulanıyor...</Paragraph>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center', borderColor: '#E2E8F0' }}>
          <TeamOutlined style={{ fontSize: 48, color: '#2563EB', marginBottom: 16 }} />
          <Title level={3}>Sınıf Daveti</Title>
          <Paragraph style={{ color: '#64748B' }}>
            CENNA.live üzerinde bir akademik sınıfa katılmanız için bir davet aldınız. Katılmak için lütfen giriş yapın veya yeni bir hesap oluşturun.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/auth/login')}
            style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 44, padding: '0 28px' }}
          >
            Giriş Yap ve Daveti Kabul Et
          </Button>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }}>
          <Result
            status="success"
            title="Sınıfa Başarıyla Kaydoldunuz!"
            subTitle={`${classroomData?.name || 'Sınıfın'} aktif bir üyesi oldunuz. Atanan derslerinizde aktif hatırlama çalışmalarına hemen başlayabilirsiniz.`}
            extra={[
              <Button
                type="primary"
                key="today"
                onClick={() => navigate('/app/today')}
                style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
              >
                Bugünün Çalışma Paneline Git
              </Button>,
              <Button key="classrooms" onClick={() => navigate('/app/classrooms')}>
                Sınıflarımı Görüntüle
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 540, margin: '60px auto', padding: '0 20px' }}>
      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }}>
        <Result
          status="error"
          title="Davet Kodu Kullanılamadı"
          subTitle={errorMessage || 'Bu davet bağlantısının süresi dolmuş, kullanım sınırına ulaşılmış veya bağlantı geçersiz olabilir.'}
          extra={[
            <Button
              type="primary"
              key="classrooms"
              onClick={() => navigate('/app/classrooms')}
              style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
            >
              Sınıflarım
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};
