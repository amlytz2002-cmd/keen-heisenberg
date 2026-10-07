import React from 'react';
import { Card, Progress, Typography, Space, Tag, Row, Col, Statistic } from 'antd';
import { FieldTimeOutlined, TrophyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { calculateRetrievability } from '../../lib/engines/fsrs';

const { Title, Text, Paragraph } = Typography;

export interface ConceptMasteryRecord {
  conceptSlug: string;
  nameTr: string;
  pillar: string;
  masteryScore: number; // 0.0 - 1.0
  stabilityDays: number;
  lastReviewedDaysAgo: number;
  nextDueInDays: number;
}

export const MasteryView: React.FC<{ concepts: ConceptMasteryRecord[] }> = ({ concepts }) => {
  const defaultConcepts: ConceptMasteryRecord[] = [
    {
      conceptSlug: 'crcl_cockcroft_gault',
      nameTr: 'Kreatinin Klerensi (Cockcroft-Gault)',
      pillar: 'Biyofarmasötik & Klerens',
      masteryScore: 0.85,
      stabilityDays: 4.2,
      lastReviewedDaysAgo: 0.5,
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
  ];

  const list = concepts.length > 0 ? concepts : defaultConcepts;
  const overallMastery = Math.round((list.reduce((acc, c) => acc + c.masteryScore, 0) / list.length) * 100);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px' }}>
      <div style={{ marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0, color: '#0F172A' }}>
          <TrophyOutlined style={{ marginRight: 8, color: '#2563EB' }} />
          Kavram Ustalığı & FSRS Hafıza Takibi
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
          Free Spaced Repetition Scheduler (FSRS) ile modellenen bellek stabilitesi ve geri çağırma olasılığı.
        </Paragraph>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Row gutter={16} align="middle">
          <Col span={10} style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={overallMastery}
              width={90}
              strokeColor={{ '0%': '#2563EB', '100%': '#16A34A' }}
              format={(p) => <span style={{ fontSize: 16, fontWeight: 700 }}>%{p}</span>}
            />
          </Col>
          <Col span={14}>
            <Statistic
              title="Genel Farmakokinetik Ustalığı"
              value={overallMastery}
              suffix="%"
              valueStyle={{ color: '#0F172A', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Dönem 3 Biyofarmasötik dersi ağırlıklı yeterlilik puanı.
            </Text>
          </Col>
        </Row>
      </Card>

      <Title level={5} style={{ marginBottom: 10, fontSize: 14, color: '#334155' }}>
        Kavram Bazlı Bellek Stabilitesi (FSRS)
      </Title>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {list.map((c) => {
          const retrievability = Math.round(calculateRetrievability(c.stabilityDays, c.lastReviewedDaysAgo) * 100);
          return (
            <Card
              key={c.conceptSlug}
              bordered={false}
              size="small"
              style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <Text strong style={{ fontSize: 13, color: '#0F172A' }}>{c.nameTr}</Text>
                  <br />
                  <Tag color="blue" style={{ fontSize: 10, marginTop: 2 }}>{c.pillar}</Tag>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Tag
                    color={c.nextDueInDays <= 0 ? 'red' : c.nextDueInDays === 1 ? 'orange' : 'green'}
                    icon={<FieldTimeOutlined />}
                    style={{ fontWeight: 600, fontSize: 11 }}
                  >
                    {c.nextDueInDays <= 0 ? 'Bugün Tekrar' : `${c.nextDueInDays} gün sonra`}
                  </Tag>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                  <Text type="secondary">Kavram Ustalığı (θ):</Text>
                  <Text strong>{Math.round(c.masteryScore * 100)}%</Text>
                </div>
                <Progress percent={Math.round(c.masteryScore * 100)} size="small" status="active" />
              </div>

              <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B' }}>
                <span>
                  <ThunderboltOutlined style={{ color: '#D97706', marginRight: 4 }} />
                  Stabilite: <Text strong style={{ fontSize: 11 }}>{c.stabilityDays} gün</Text>
                </span>
                <span>
                  Hatırlanabilirlik R(t): <Text strong style={{ color: retrievability >= 85 ? '#16A34A' : '#D97706', fontSize: 11 }}>%{retrievability}</Text>
                </span>
              </div>
            </Card>
          );
        })}
      </Space>
    </div>
  );
};
