import React, { useState } from 'react';
import { Card, Tabs, Typography, Tag } from 'antd';

const { Title, Paragraph } = Typography;

export const LegalView: React.FC<{ initialTab?: 'privacy' | 'terms' }> = ({ initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '60px 20px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Tag color="geekblue">Compliance & Governance</Tag>
        <Title level={1} style={{ fontSize: 32, fontWeight: 850, marginTop: 8, color: '#0F172A' }}>
          CENNA.live Policies & Legal Terms
        </Title>
      </div>

      <Card bordered style={{ borderRadius: 12, borderColor: '#E2E8F0', padding: '12px 16px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'privacy' | 'terms')}
          items={[
            {
              key: 'privacy',
              label: 'Privacy Policy & Data Isolation',
              children: (
                <div style={{ padding: '16px 0', color: '#334155', lineHeight: 1.7 }}>
                  <Title level={3} style={{ color: '#0F172A' }}>1. Privacy by Default</Title>
                  <Paragraph>
                    CENNA.live prioritizes data privacy and student intellectual isolation. Personal study sessions,
                    question attempts, hint logs, and exam answers are protected by PostgreSQL Row Level Security (RLS).
                    Learners can only view their own study progress, and instructors can only review student activity
                    within classrooms where they have active instructional authority.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>2. Zero Public Discussion Feeds or Content Leaks</Title>
                  <Paragraph>
                    Course resources, instructor slides, and student attempts are never posted to public feeds or
                    unauthenticated forums. All document storage buckets are strictly private and accessible only through
                    authenticated, time-limited signed URLs or authorized server-side processing pipelines.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>3. AI Model Data Protections</Title>
                  <Paragraph>
                    Uploaded lecture materials processed for concept extraction and question generation are never used
                    to train public AI foundation models. All model prompts are scrubbed of personal identifiers and
                    processed via private enterprise edge endpoints.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>4. Auditability & Administrator Restrictions</Title>
                  <Paragraph>
                    Administrative operations are logged in immutable audit tables. Platform administrators cannot browse
                    private student content or alter exam results arbitrarily.
                  </Paragraph>
                </div>
              ),
            },
            {
              key: 'terms',
              label: 'Terms of Service',
              children: (
                <div style={{ padding: '16px 0', color: '#334155', lineHeight: 1.7 }}>
                  <Title level={3} style={{ color: '#0F172A' }}>1. Academic Integrity & Platform Intent</Title>
                  <Paragraph>
                    CENNA.live is an educational mastery and retrieval platform. It is engineered to cultivate genuine
                    understanding through active recall. Users agree not to misuse platform APIs or attempt to circumvent
                    timed exam deadlines or question scaffolding.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>2. No Medical or Clinical Diagnosis</Title>
                  <Paragraph>
                    CENNA.live provides academic educational practice for pharmacy and health sciences students. It is
                    explicitly NOT a clinical decision support system, diagnostic tool, or medical treatment advisor.
                    Users must never rely on platform questions or hints for active patient clinical care.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>3. Instructor Publication Responsibility</Title>
                  <Paragraph>
                    AI-generated concepts, questions, and hints are drafts until reviewed and approved by course instructors.
                    Instructors bear sole responsibility for verifying the accuracy of learning materials before publishing
                    them to classroom learners.
                  </Paragraph>

                  <Title level={3} style={{ color: '#0F172A', marginTop: 24 }}>4. Pilot Status</Title>
                  <Paragraph>
                    This version (v1.0 Pilot) is offered for academic evaluation. Features are subject to refinement based on
                    pedagogical effectiveness and instructor feedback.
                  </Paragraph>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
