import React, { useEffect, useState } from 'react';
import { ConfigProvider, Button, Tag, Typography } from 'antd';
import { UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { CalculationDrill } from './app/drill/CalculationDrill';
import { ensureDemoSession, supabase } from './lib/supabaseClient';

const { Text } = Typography;

export const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, []);

  const handleLoginDemo = async () => {
    setAuthLoading(true);
    const user = await ensureDemoSession();
    if (user?.email) {
      setUserEmail(user.email);
    }
    setAuthLoading(false);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563EB',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
        {/* Top Pilot Navigation Bar */}
        <header
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '10px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{
              maxWidth: 480,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Text strong style={{ fontSize: 16, color: '#0F172A', letterSpacing: '-0.3px' }}>
                Pharm<span style={{ color: '#2563EB' }}>IQ</span>
              </Text>
              <Tag color="cyan" style={{ marginLeft: 8, fontSize: 11, borderRadius: 4 }}>
                Biruni Pilot
              </Tag>
            </div>

            <div>
              {userEmail ? (
                <Tag icon={<CheckCircleOutlined />} color="success" style={{ borderRadius: 6 }}>
                  {userEmail.split('@')[0]}
                </Tag>
              ) : (
                <Button
                  size="small"
                  type="default"
                  icon={<UserOutlined />}
                  loading={authLoading}
                  onClick={handleLoginDemo}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  Demo Girişi
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Calculation Drill Screen */}
        <main>
          <CalculationDrill />
        </main>
      </div>
    </ConfigProvider>
  );
};

export default App;
