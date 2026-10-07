import React, { useEffect, useState } from 'react';
import { ConfigProvider, Button, Tag, Typography, Segmented } from 'antd';
import { UserOutlined, CheckCircleOutlined, CalculatorOutlined, BugOutlined, BulbOutlined, TrophyOutlined } from '@ant-design/icons';
import { CalculationDrill } from './app/drill/CalculationDrill';
import { ErrorClinic, ErrorEventRecord } from './app/clinic/ErrorClinic';
import { NextTimeRulesView, NextTimeRuleItem } from './app/rules/NextTimeRulesView';
import { MasteryView, ConceptMasteryRecord } from './app/mastery/MasteryView';
import { ensureDemoSession, supabase } from './lib/supabaseClient';

const { Text } = Typography;

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'drill' | 'clinic' | 'rules' | 'mastery'>('drill');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // App-level state buffers (synced with Supabase and local drills)
  const [errors, setErrors] = useState<ErrorEventRecord[]>([
    {
      id: 'err-1',
      concept_name: 'Cockcroft-Gault Klerens',
      error_family: 'DAG_NODE_FAILURE',
      misconception_tag: 'MISSED_FEMALE_FACTOR_0_85',
      failed_node: 'crcl_final_node',
      is_hypercorrection: true,
      resolved: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  const [rules, setRules] = useState<NextTimeRuleItem[]>([
    {
      id: 'rule-1',
      misconception_tag: 'MISSED_FEMALE_FACTOR_0_85',
      rule_text_tr: 'Kadın hastalarda CrCl hesaplarken formül sonucunu daima 0.85 katsayısı ile çarpmayı unutma.',
      times_shown: 2,
      edited_by_user: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  const [concepts] = useState<ConceptMasteryRecord[]>([
    {
      conceptSlug: 'crcl_cockcroft_gault',
      nameTr: 'Kreatinin Klerensi (Cockcroft-Gault)',
      pillar: 'Biyofarmasötik & Klerens',
      masteryScore: 0.85,
      stabilityDays: 4.2,
      lastReviewedDaysAgo: 0.2,
      nextDueInDays: 3,
    },
    {
      conceptSlug: 'gentamicin_elimination',
      nameTr: 'Gentamisin Eliminasyon Hızı & Yarı Ömür',
      pillar: '1-Kompartman İntravenöz PK',
      masteryScore: 0.70,
      stabilityDays: 2.1,
      lastReviewedDaysAgo: 1.0,
      nextDueInDays: 1,
    },
    {
      conceptSlug: 'theophylline_loading_dose',
      nameTr: 'Teofilin Dağılım Hacmi & Yükleme Dozu',
      pillar: 'Klinik Dozaj Rejimi',
      masteryScore: 0.60,
      stabilityDays: 1.5,
      lastReviewedDaysAgo: 2.0,
      nextDueInDays: 0,
    },
  ]);

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

  const handleNewError = (err: ErrorEventRecord) => {
    setErrors((prev) => [err, ...prev]);
  };

  const handleNewRule = (rule: NextTimeRuleItem) => {
    setRules((prev) => [rule, ...prev]);
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
      <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 32 }}>
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

        {/* View Switcher Tabs (Segmented) */}
        <div style={{ maxWidth: 480, margin: '12px auto 0 auto', padding: '0 12px' }}>
          <Segmented
            block
            value={currentTab}
            onChange={(val) => setCurrentTab(val as any)}
            options={[
              { label: 'Görev', value: 'drill', icon: <CalculatorOutlined /> },
              { label: 'Klinik', value: 'clinic', icon: <BugOutlined /> },
              { label: 'Kurallarım', value: 'rules', icon: <BulbOutlined /> },
              { label: 'Ustalık', value: 'mastery', icon: <TrophyOutlined /> },
            ]}
            style={{ background: '#E2E8F0', borderRadius: 8, padding: 3 }}
          />
        </div>

        {/* Main Content Area */}
        <main>
          {currentTab === 'drill' && (
            <CalculationDrill
              onErrorLogged={handleNewError}
              onRuleLogged={handleNewRule}
            />
          )}
          {currentTab === 'clinic' && <ErrorClinic localErrors={errors} />}
          {currentTab === 'rules' && <NextTimeRulesView localRules={rules} />}
          {currentTab === 'mastery' && <MasteryView concepts={concepts} />}
        </main>
      </div>
    </ConfigProvider>
  );
};

export default App;
