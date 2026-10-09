import React from 'react';
import { Card, Col, Row, Tag, Typography, Button } from 'antd';
import {
  FileTextOutlined,
  BulbOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';

const { Title, Paragraph } = Typography;

export const FeaturesView: React.FC = () => {
  const { navigate } = useRouter();

  const features = [
    {
      icon: <FileTextOutlined style={{ fontSize: 28, color: '#2563EB' }} />,
      title: 'Automated Document Ingestion & Provenance',
      desc: 'Upload PDFs, Word documents, Markdown files, or lecture notes. CENNA.live splits documents into semantically coherent chunks, extracting core concepts and questions while strictly preserving source page and paragraph coordinates.',
      tags: ['PDF & DOCX', 'Semantic Chunking', 'Paragraph Provenance'],
    },
    {
      icon: <BulbOutlined style={{ fontSize: 28, color: '#D97706' }} />,
      title: '3-Stage Socratic Hint Ladders',
      desc: 'Hints graduated through three pedagogical levels: Stage 1 (Orientation: foundational principles), Stage 2 (Reasoning: structural relationships), and Stage 3 (Application: mathematical or clinical step-by-step guidance) before full answer disclosure.',
      tags: ['Orientation', 'Reasoning', 'Application', 'No Immediate Answers'],
    },
    {
      icon: <HistoryOutlined style={{ fontSize: 28, color: '#7C3AED' }} />,
      title: '1, 3, 7, 14-Day Spaced Repetition Engine',
      desc: 'Mathematical memory consolidation based on the Ebbinghaus forgetting curve. Successful retrievals advance stability through 1-day, 3-day, 7-day, and 14-day intervals. Incorrect answers trigger an immediate lapse reset to interval 1.',
      tags: ['Interval Consolidation', 'Lapse Reset', 'Dynamic Mastery 0–100'],
    },
    {
      icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#DC2626' }} />,
      title: 'Authoritative Timed Mock Exams',
      desc: 'Server-enforced deadlines calculated at exam start (deadline_at = NOW() + duration). Periodic intermediate answer autosave protects against network dropouts. Once the deadline passes, late submissions are strictly rejected.',
      tags: ['Server Deadline', 'Autosave', 'Question Palette', 'Topic Remediation'],
    },
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: 28, color: '#059669' }} />,
      title: 'Instructor Content Review Workspace',
      desc: 'Zero hallucinated educational content reaches students automatically. AI-extracted questions and concepts are deposited into a mandatory "Needs Review" state where instructors inspect side-by-side source excerpts, edit, approve, or reject.',
      tags: ['Anti-Hallucination', 'Side-by-Side Review', 'Publish Gate'],
    },
    {
      icon: <DatabaseOutlined style={{ fontSize: 28, color: '#0284C7' }} />,
      title: 'Enterprise Row Level Security (RLS)',
      desc: 'PostgreSQL Row Level Security ensures total data isolation between classrooms, organizations, and students. Server secrets remain in Cloudflare Pages edge functions and never enter browser client bundles.',
      tags: ['PostgreSQL 17 RLS', 'Edge Functions', 'Zero Secret Leaks'],
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 20px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Tag color="blue">Platform Architecture</Tag>
        <Title level={1} style={{ fontSize: 36, fontWeight: 800, marginTop: 12, color: '#0F172A' }}>
          Deeply Integrated Educational Technology
        </Title>
        <Paragraph style={{ fontSize: 16, color: '#64748B', maxWidth: 680, margin: '0 auto' }}>
          Every feature in CENNA.live is built vertically from the database layer to the mobile interface to reinforce real learning.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {features.map((f, i) => (
          <Col xs={24} md={12} key={i}>
            <Card
              bordered
              style={{
                height: '100%',
                borderRadius: 14,
                borderColor: '#E2E8F0',
                display: 'flex',
                flexDirection: 'column',
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>
                    {f.title}
                  </Title>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {f.tags.map((t) => (
                      <Tag key={t} style={{ fontSize: 11, borderRadius: 4, margin: 0 }}>
                        {t}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
              <Paragraph style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <Button
          type="primary"
          size="large"
          icon={<ArrowRightOutlined />}
          onClick={() => navigate('/auth/login')}
          style={{ height: 48, padding: '0 32px', borderRadius: 8, backgroundColor: '#2563EB' }}
        >
          Try CENNA.live Now
        </Button>
      </div>
    </div>
  );
};
