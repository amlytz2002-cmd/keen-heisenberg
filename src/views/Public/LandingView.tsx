import React from 'react';
import { Button, Card, Col, Row, Tag, Typography, Space } from 'antd';
import {
  RocketOutlined,
  ReadOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  LockOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';

const { Title, Paragraph, Text } = Typography;

export const LandingView: React.FC = () => {
  const { navigate } = useRouter();
  const { user, activeRole } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate(activeRole === 'instructor' ? '/app/teach' : '/app/today');
    } else {
      navigate('/auth/login');
    }
  };

  const steps = [
    {
      step: '1',
      title: 'Learn',
      icon: <ReadOutlined style={{ fontSize: 24, color: '#2563EB' }} />,
      desc: 'Digest core concepts grounded in authoritative course documents with page and paragraph citations.',
    },
    {
      step: '2',
      title: 'Retrieve',
      icon: <QuestionCircleOutlined style={{ fontSize: 24, color: '#0284C7' }} />,
      desc: 'Practice closed-book active recall with single-choice, multi-select, and clinical calculation items.',
    },
    {
      step: '3',
      title: 'Apply',
      icon: <BulbOutlined style={{ fontSize: 24, color: '#D97706' }} />,
      desc: 'Use 3-stage Socratic hint ladders (Orientation → Reasoning → Application) before answers are revealed.',
    },
    {
      step: '4',
      title: 'Remediate',
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#059669' }} />,
      desc: 'Diagnose misconceptions instantly with granular feedback referencing exact source chunks.',
    },
    {
      step: '5',
      title: 'Review',
      icon: <HistoryOutlined style={{ fontSize: 24, color: '#7C3AED' }} />,
      desc: 'Strengthen long-term retention through scientifically scheduled 1, 3, 7, and 14-day spaced reviews.',
    },
  ];

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #EFF6FF 100%)',
          padding: '80px 20px 60px',
          borderBottom: '1px solid #E2E8F0',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <Tag color="blue" style={{ padding: '6px 14px', fontSize: 13, borderRadius: 20, fontWeight: 600 }}>
            <RocketOutlined style={{ marginRight: 6 }} /> CENNA.live Pilot 1.0 — Active Retrieval Engine
          </Tag>
          <Title
            level={1}
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 850,
              color: '#0F172A',
              letterSpacing: '-1.5px',
              marginTop: 20,
              marginBottom: 16,
              lineHeight: 1.15,
            }}
          >
            Deliberate Practice Powered by <span style={{ color: '#2563EB' }}>Verified AI</span>.
          </Title>
          <Paragraph
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              color: '#475569',
              lineHeight: 1.6,
              maxWidth: 720,
              margin: '0 auto 32px',
            }}
          >
            Move beyond passive rereading. CENNA.live converts authoritative course materials into structured ~25-minute
            study sessions, graduated Socratic hints, and spaced retrieval queues.
          </Paragraph>

          <Space direction="horizontal" size="middle" wrap style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={handleStart}
              style={{
                height: 50,
                padding: '0 32px',
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 10,
                backgroundColor: '#2563EB',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              {user ? 'Enter Your Learning Hub' : 'Get Started Now'}
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/how-it-works')}
              style={{
                height: 50,
                padding: '0 28px',
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 10,
              }}
            >
              Pedagogical Framework
            </Button>
          </Space>

          {/* Quick Metrics Bar */}
          <div
            style={{
              marginTop: 48,
              padding: '16px 24px',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
              gap: 16,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div>
              <Text strong style={{ fontSize: 18, color: '#0F172A', display: 'block' }}>
                ~25 Minutes
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Target Daily Study Unit
              </Text>
            </div>
            <div style={{ borderLeft: '1px solid #E2E8F0', height: 36 }} />
            <div>
              <Text strong style={{ fontSize: 18, color: '#0F172A', display: 'block' }}>
                1 · 3 · 7 · 14 Days
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Spaced Retention Cycles
              </Text>
            </div>
            <div style={{ borderLeft: '1px solid #E2E8F0', height: 36 }} />
            <div>
              <Text strong style={{ fontSize: 18, color: '#0F172A', display: 'block' }}>
                3-Stage Ladder
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Progressive Socratic Hints
              </Text>
            </div>
            <div style={{ borderLeft: '1px solid #E2E8F0', height: 36 }} />
            <div>
              <Text strong style={{ fontSize: 18, color: '#0F172A', display: 'block' }}>
                100% Grounded
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Instructor Review Gate
              </Text>
            </div>
          </div>
        </div>
      </section>

      {/* The 5-Stage Learning Cycle */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Tag color="cyan">Pedagogical Framework</Tag>
          <Title level={2} style={{ fontSize: 32, fontWeight: 800, marginTop: 12, color: '#0F172A' }}>
            The Continuous Study Cycle
          </Title>
          <Paragraph style={{ fontSize: 16, color: '#64748B', maxWidth: 640, margin: '0 auto' }}>
            A rigorous scientific model designed to reinforce deep conceptual understanding and long-term memory.
          </Paragraph>
        </div>

        <Row gutter={[20, 20]}>
          {steps.map((item) => (
            <Col xs={24} sm={12} lg={4} key={item.step} style={{ flex: '1 1 200px' }}>
              <Card
                bordered
                style={{
                  height: '100%',
                  borderRadius: 12,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                bodyStyle={{ padding: 20 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </div>
                  <Tag style={{ borderRadius: 12, fontWeight: 700, margin: 0 }}>
                    Step {item.step}
                  </Tag>
                </div>
                <Title level={4} style={{ margin: '0 0 8px 0', fontSize: 18, color: '#0F172A' }}>
                  {item.title}
                </Title>
                <Text style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                  {item.desc}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Dual Value Proposition: Students & Instructors */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '64px 20px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} md={12}>
              <div style={{ paddingRight: 20 }}>
                <Tag color="blue" style={{ marginBottom: 12 }}>For Students</Tag>
                <Title level={2} style={{ fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                  Know Exactly What to Study Today
                </Title>
                <Paragraph style={{ fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
                  No more wondering where to begin. Your personalized <strong>Today</strong> dashboard computes due
                  spaced reviews, targets weak concepts, and provides bite-sized active recall sessions with
                  graduated hints that build genuine comprehension rather than superficial recognition.
                </Paragraph>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <CheckCircleOutlined style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Active Retrieval:</strong> Questions with real-time feedback and explanation citations.
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <CheckCircleOutlined style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Socratic Hint Ladder:</strong> Orientation, reasoning, and application hints before answer reveal.
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <CheckCircleOutlined style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Timed Mock Exams:</strong> Strict server-enforced deadlines with post-exam concept remediation.
                    </Text>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Card
                bordered
                style={{
                  borderRadius: 16,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text strong style={{ color: '#0F172A' }}>Active Concept Card</Text>
                  <Tag color="green">Mastery: 72%</Tag>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Clinical Pharmacokinetics · Chapter 4
                  </Text>
                  <Title level={4} style={{ margin: '4px 0 8px 0', fontSize: 17, color: '#0F172A' }}>
                    Creatinine Clearance & Cockcroft-Gault Equation
                  </Title>
                  <Text style={{ fontSize: 13, color: '#475569' }}>
                    "For female patients, multiply the calculated CrCl value by 0.85 to account for lower average muscle mass."
                  </Text>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                    Source: <span style={{ textDecoration: 'underline' }}>Pharmacokinetics_Manual.pdf (Page 42, Para 3)</span>
                  </div>
                </div>
                <Button block type="primary" onClick={handleStart} style={{ backgroundColor: '#2563EB', borderRadius: 8 }}>
                  Practice Retrieval Questions
                </Button>
              </Card>
            </Col>
          </Row>

          <div style={{ margin: '64px 0', borderTop: '1px solid #E2E8F0' }} />

          <Row gutter={[40, 40]} align="middle">
            <Col xs={24} md={12} order={2}>
              <div style={{ paddingLeft: 20 }}>
                <Tag color="purple" style={{ marginBottom: 12 }}>For Instructors</Tag>
                <Title level={2} style={{ fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                  Curate, Verify, and Supervise with Ease
                </Title>
                <Paragraph style={{ fontSize: 15, color: '#475569', lineHeight: 1.7 }}>
                  Upload syllabi, slides, and clinical notes. CENNA.live extracts structured concepts and drafts retrieval
                  questions grounded strictly in your files. With the <strong>Content Review Workspace</strong>, no AI content
                  ever reaches students without your explicit sign-off.
                </Paragraph>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <FileSearchOutlined style={{ color: '#7C3AED', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Automated Semantic Chunking:</strong> Every extracted question links to exact source paragraphs.
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <LockOutlined style={{ color: '#7C3AED', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Strict Review Gate:</strong> Drafts stay in <code>needs_review</code> until approved and published.
                    </Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <ClockCircleOutlined style={{ color: '#7C3AED', fontSize: 18, marginTop: 2 }} />
                    <Text style={{ fontSize: 14, color: '#334155' }}>
                      <strong>Classroom Analytics:</strong> Spot difficult concepts and high-error topics before final exams.
                    </Text>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12} order={1}>
              <Card
                bordered
                style={{
                  borderRadius: 16,
                  borderColor: '#E2E8F0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text strong style={{ color: '#0F172A' }}>Instructor Content Review Gate</Text>
                  <Tag color="orange">Status: Needs Review</Tag>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                    Q: Calculate CrCl for a 65-year-old female (60 kg, Serum Cr 1.2 mg/dL).
                  </Text>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                    Provenance: <Text code>Biopharmaceutics_Lec03.pdf (Chunk #14)</Text>
                  </div>
                </div>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button size="small" danger>Reject</Button>
                  <Button size="small">Edit</Button>
                  <Button size="small" type="primary" style={{ backgroundColor: '#059669' }}>
                    Approve & Publish
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ backgroundColor: '#1E293B', color: '#FFFFFF', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Title level={2} style={{ color: '#FFFFFF', fontWeight: 800 }}>
            Ready for Evidence-Based Study?
          </Title>
          <Paragraph style={{ color: '#94A3B8', fontSize: 16, marginBottom: 28 }}>
            Join the CENNA.live pilot and experience structured, grounded retrieval practice built for serious academic achievement.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={handleStart}
            style={{
              height: 48,
              padding: '0 32px',
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              backgroundColor: '#2563EB',
            }}
          >
            Launch CENNA.live
          </Button>
        </div>
      </section>
    </div>
  );
};
