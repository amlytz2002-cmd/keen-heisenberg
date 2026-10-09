import React from 'react';
import { Card, Typography, Button, Tag, Alert } from 'antd';
import {
  ReadOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';

const { Title, Paragraph } = Typography;

export const HowItWorksView: React.FC = () => {
  const { navigate } = useRouter();

  const cycleDetails = [
    {
      title: '1. Learn (Source Grounding)',
      icon: <ReadOutlined />,
      description:
        'Instead of reading generic internet summaries or unverified AI output, the student studies bite-sized concept cards created directly from the instructor’s uploaded course files. Every definition and formula specifies its document filename, page number, and paragraph coordinates.',
    },
    {
      title: '2. Retrieve (Active Recall)',
      icon: <QuestionCircleOutlined />,
      description:
        'The student is immediately prompted with closed-book retrieval questions. By testing memory retrieval before looking at answers or notes, cognitive pathways are reinforced through the testing effect (Roediger & Karpicke, 2006).',
    },
    {
      title: '3. Apply (Socratic Hint Progression)',
      icon: <BulbOutlined />,
      description:
        'When a student feels stuck, they do not get immediate answer leakage. They request graduated Socratic guidance: Stage 1 clarifies the governing principle, Stage 2 reveals intermediate relationships, and Stage 3 outlines specific substitution steps.',
    },
    {
      title: '4. Remediate (Instant Grounded Diagnosis)',
      icon: <CheckCircleOutlined />,
      description:
        'Upon answering, the system explains exactly why the chosen option is correct or incorrect, citing the course text. Misconceptions are flagged, and concept mastery is recalculated in real time.',
    },
    {
      title: '5. Review (Consolidation Schedule)',
      icon: <HistoryOutlined />,
      description:
        'Items are automatically added to the spaced repetition review queue. Successful retrievals schedule reviews at 1, 3, 7, and 14-day intervals. If a concept lapses, its interval resets to Day 1 to ensure mastery before high-stakes exams.',
    },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 20px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Tag color="purple">Pedagogical Design</Tag>
        <Title level={1} style={{ fontSize: 36, fontWeight: 800, marginTop: 12, color: '#0F172A' }}>
          The Continuous Study Cycle
        </Title>
        <Paragraph style={{ fontSize: 16, color: '#64748B', maxWidth: 640, margin: '0 auto' }}>
          Learn → Retrieve → Apply → Remediate → Review: How CENNA.live turns dense course documents into lasting mastery.
        </Paragraph>
      </div>

      <Alert
        message="Evidence-Based Learning Guarantee"
        description="Educational research confirms that active retrieval combined with spaced scheduling and graduated scaffolding dramatically outperforms passive rereading and uncontrolled chatbot exploration."
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: 36, borderRadius: 10 }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {cycleDetails.map((item, idx) => (
          <Card
            key={idx}
            bordered
            style={{
              borderRadius: 12,
              borderColor: '#E2E8F0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <Title level={3} style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>
                  {item.title}
                </Title>
                <Paragraph style={{ marginTop: 8, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  {item.description}
                </Paragraph>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/auth/login')}
          style={{ height: 48, padding: '0 32px', borderRadius: 8, backgroundColor: '#2563EB' }}
        >
          Begin Learning on CENNA.live
        </Button>
      </div>
    </div>
  );
};
