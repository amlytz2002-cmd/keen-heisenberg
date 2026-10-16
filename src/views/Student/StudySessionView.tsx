import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Radio,
  Checkbox,
  Input,
  Tag,
  Modal,
  Alert,
  Spin,
  Space,
  Progress,
} from 'antd';
import {
  BulbOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph, Text } = Typography;

export const StudySessionView: React.FC = () => {
  const { params, navigate } = useRouter();
  const sessionId = params.sessionId;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<any>('');
  const [submitting, setSubmitting] = useState(false);
  const [answerResult, setAnswerResult] = useState<any>(null);

  // Socratic Hint Ladder state
  const [hintModalOpen, setHintModalOpen] = useState(false);
  const [currentHintStage, setCurrentHintStage] = useState(1);
  const [hintTexts, setHintTexts] = useState<{ [stage: number]: string }>({});
  const [requestingHint, setRequestingHint] = useState(false);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);

  // Timing
  const [startTime, setStartTime] = useState<number>(Date.now());

  const fetchSession = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.study.getSession(sessionId ? { session_id: sessionId } : undefined);
      if (res.success && res.data) {
        setSessionData(res.data);
        setStartTime(Date.now());
      } else {
        setErrorMsg(res.error || 'Çalışma oturumu başlatılamadı. Lütfen tekrar deneyin.');
      }
    } catch (err: unknown) {
      console.error('Error fetching study session:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const questions = sessionData?.questions || [];
  const activeQuestion = questions[currentQuestionIndex];
  const concept = sessionData?.concept;

  const handleRequestHint = async (stageToRequest: number) => {
    if (!activeQuestion) return;
    setRequestingHint(true);
    try {
      const res = await api.study.requestHint({
        session_id: sessionData?.session?.id,
        question_id: activeQuestion.id,
        hint_stage: stageToRequest,
      });

      if (res.success && res.data) {
        setHintTexts((prev) => ({
          ...prev,
          [stageToRequest]: res.data.hint_text,
        }));
        setCurrentHintStage(stageToRequest);
        setHintsUsedCount((c) => Math.max(c, stageToRequest));
      }
    } catch (err) {
      console.error('Error requesting hint:', err);
    } finally {
      setRequestingHint(false);
    }
  };

  const openHintModal = () => {
    setHintModalOpen(true);
    if (!hintTexts[1]) {
      handleRequestHint(1);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) return;
    setSubmitting(true);
    try {
      const responseTimeMs = Date.now() - startTime;
      const res = await api.study.submitAnswer({
        session_id: sessionData?.session?.id,
        question_id: activeQuestion.id,
        user_answer: userAnswer,
        response_time_ms: responseTimeMs,
        hints_used_count: hintsUsedCount,
      });

      if (res.success && res.data) {
        setAnswerResult(res.data);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setAnswerResult(null);
    setUserAnswer('');
    setHintTexts({});
    setCurrentHintStage(1);
    setHintsUsedCount(0);
    setStartTime(Date.now());

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Completed session
      navigate('/app/today');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#94A3B8' }}>Aktif hatırlama oturumu yükleniyor...</Paragraph>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center', borderColor: '#DC2626' }}>
          <Alert
            message="Oturum Yüklenemedi"
            description={errorMsg}
            type="error"
            showIcon
            style={{ marginBottom: 20, textAlign: 'left', borderRadius: 8 }}
          />
          <Space>
            <Button type="primary" onClick={fetchSession} style={{ backgroundColor: '#2563EB', borderRadius: 8 }}>
              Tekrar Dene
            </Button>
            <Button onClick={() => navigate('/app/today')} style={{ borderRadius: 8 }}>
              Bugünün Paneline Dön
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center' }}>
          <Title level={3} style={{ color: '#F8FAFC' }}>Aktif Soru Bulunamadı</Title>
          <Paragraph style={{ color: '#94A3B8' }}>
            Bu kavram veya oturum için henüz tanımlanmış soru bulunmuyor.
          </Paragraph>
          <Button
            type="primary"
            onClick={() => navigate('/app/today')}
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Bugünün Paneline Dön
          </Button>
        </Card>
      </div>
    );
  }

  if (!activeQuestion) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#10B981', marginBottom: 16 }} />
          <Title level={3} style={{ color: '#F8FAFC' }}>Çalışma Oturumu Tamamlandı</Title>
          <Paragraph style={{ color: '#94A3B8' }}>
            Bu kavrama ait planlanan tüm aktif hatırlama sorularını başarıyla tamamladınız!
          </Paragraph>
          <Button
            type="primary"
            onClick={() => navigate('/app/today')}
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Bugünün Paneline Dön
          </Button>
        </Card>
      </div>
    );
  }

  const formatQuestionType = (type: string) => {
    switch (type) {
      case 'single_choice':
        return 'TEK SEÇENEKLİ';
      case 'multiple_choice':
        return 'ÇOKTAN SEÇMELİ';
      case 'numeric':
        return 'KLİNİK HESAPLAMA';
      case 'short_answer':
        return 'KISA CEVAP';
      default:
        return 'SORU';
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px 64px' }}>
      {/* Session Progress Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Tag color="blue">Soru {currentQuestionIndex + 1} / {questions.length}</Tag>
          <Text strong style={{ marginLeft: 8, color: '#334155' }}>
            {concept?.name || 'Aktif Kavram'}
          </Text>
        </div>
        <Button size="small" onClick={() => navigate('/app/today')}>
          Oturumdan Çık
        </Button>
      </div>

      <Progress
        percent={Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}
        strokeColor="#2563EB"
        showInfo={false}
        style={{ marginBottom: 20 }}
      />

      {/* Concept Card with Grounded Provenance */}
      {concept && (
        <Card
          bordered
          style={{
            borderRadius: 12,
            borderColor: '#1E293B',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            marginBottom: 20,
          }}
          bodyStyle={{ padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>
              Kavram: {concept.name}
            </span>
            <Tag color="cyan">Hedef %85</Tag>
          </div>
          <Paragraph style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 8px 0', lineHeight: 1.6 }}>
            {concept.description}
          </Paragraph>
          {concept.sources && concept.sources.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <FileTextOutlined />
              <span>
                Kaynak: <strong style={{ color: '#CBD5E1' }}>{concept.sources[0]?.resource_title || 'Ders Kitabı'}</strong> (Sayfa {concept.sources[0]?.page_number || '1'}, Paragraf {concept.sources[0]?.paragraph_index || '1'})
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Question Retrieval Card */}
      <Card
        bordered
        style={{
          borderRadius: 16,
          borderColor: '#1E293B',
          backgroundColor: '#0B1120',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: 28 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <Tag color="purple" style={{ borderRadius: 4 }}>
            {formatQuestionType(activeQuestion.question_type)}
          </Tag>
          <Button
            icon={<BulbOutlined style={{ color: '#F59E0B' }} />}
            onClick={openHintModal}
            style={{ borderRadius: 6, borderColor: 'rgba(245, 158, 11, 0.3)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#FBBF24' }}
          >
            Sokratik İpucu ({hintsUsedCount}/3)
          </Button>
        </div>

        <Title level={4} style={{ color: '#F8FAFC', lineHeight: 1.5, marginBottom: 24 }}>
          {activeQuestion.stem}
        </Title>

        {/* Input formats */}
        {!answerResult ? (
          <div>
            {activeQuestion.question_type === 'single_choice' && (
              <Radio.Group
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {activeQuestion.options?.map((opt: any) => (
                  <Radio
                    key={opt.key}
                    value={opt.key}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: userAnswer === opt.key ? '2px solid #3B82F6' : '1px solid #1E293B',
                      backgroundColor: userAnswer === opt.key ? 'rgba(59, 130, 246, 0.15)' : '#0F172A',
                      color: '#F8FAFC',
                      fontSize: 15,
                    }}
                  >
                    <strong>{opt.key}.</strong> {opt.text}
                  </Radio>
                ))}
              </Radio.Group>
            )}

            {activeQuestion.question_type === 'multiple_choice' && (
              <Checkbox.Group
                value={Array.isArray(userAnswer) ? userAnswer : []}
                onChange={(val) => setUserAnswer(val)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {activeQuestion.options?.map((opt: any) => {
                  const isChecked = Array.isArray(userAnswer) && userAnswer.includes(opt.key);
                  return (
                    <Checkbox
                      key={opt.key}
                      value={opt.key}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        border: isChecked ? '2px solid #3B82F6' : '1px solid #1E293B',
                        backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.15)' : '#0F172A',
                        color: '#F8FAFC',
                        fontSize: 15,
                        margin: 0,
                      }}
                    >
                      <strong>{opt.key}.</strong> {opt.text}
                    </Checkbox>
                  );
                })}
              </Checkbox.Group>
            )}

            {activeQuestion.question_type === 'numeric' && (
              <div>
                <Input
                  type="number"
                  step="any"
                  placeholder="Sayısal hesaplama sonucunu giriniz"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  size="large"
                  style={{ maxWidth: 320, borderRadius: 8 }}
                />
              </div>
            )}

            {(activeQuestion.question_type === 'short_answer' || !activeQuestion.options) && (
              <Input.TextArea
                rows={3}
                placeholder="Cevabınızı kısaca yazınız..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                style={{ borderRadius: 8 }}
              />
            )}

            <Button
              type="primary"
              size="large"
              loading={submitting}
              disabled={!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)}
              onClick={handleSubmitAnswer}
              style={{
                marginTop: 24,
                backgroundColor: '#2563EB',
                borderRadius: 8,
                height: 44,
                padding: '0 28px',
                fontWeight: 600,
              }}
            >
              Cevabı Gönder
            </Button>
          </div>
        ) : (
          /* Answer Result Feedback */
          <div>
            <Alert
              message={answerResult.is_correct ? 'Tebrikler! Doğru Cevap.' : 'Yanlış Cevap'}
              description={
                <div>
                  <Paragraph style={{ margin: '8px 0 12px 0', fontSize: 14, color: '#334155' }}>
                    {answerResult.explanation || activeQuestion.explanation}
                  </Paragraph>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                    <Tag color={answerResult.is_correct ? 'green' : 'volcano'}>
                      Kavrama Skoru: %{answerResult.mastery_score || 75}
                    </Tag>
                    {answerResult.next_review_days && (
                      <Tag color="purple">
                        Sonraki Tekrar: {answerResult.next_review_days} gün sonra
                      </Tag>
                    )}
                  </div>
                </div>
              }
              type={answerResult.is_correct ? 'success' : 'error'}
              showIcon
              style={{ borderRadius: 10, marginBottom: 20 }}
            />

            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={handleNextQuestion}
              style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 44 }}
            >
              {currentQuestionIndex + 1 < questions.length ? 'Sonraki Soruya Geç' : 'Oturumu Tamamla'}
            </Button>
          </div>
        )}
      </Card>

      {/* Socratic Hint Progression Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BulbOutlined style={{ color: '#D97706' }} />
            <span>3 Kademeli Sokratik İpucu Merdiveni</span>
          </div>
        }
        open={hintModalOpen}
        onCancel={() => setHintModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setHintModalOpen(false)}>
            Kapat
          </Button>,
          currentHintStage < 3 && (
            <Button
              key="next_hint"
              type="primary"
              loading={requestingHint}
              onClick={() => handleRequestHint(currentHintStage + 1)}
              style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}
            >
              {currentHintStage + 1}. Kademe İpucunu Aç
            </Button>
          ),
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <Paragraph style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
            Kademeli ipuçları nihai cevabı ifşa etmeden zihinsel yönlendirme sağlar ve aktif geri çağırmayı pekiştirir.
          </Paragraph>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Stage 1 */}
            <Card
              size="small"
              bordered
              style={{
                borderRadius: 8,
                backgroundColor: currentHintStage >= 1 ? '#FEF3C7' : '#F1F5F9',
                borderColor: currentHintStage >= 1 ? '#FDE68A' : '#E2E8F0',
              }}
            >
              <Text strong style={{ color: '#92400E' }}>
                1. Kademe: Yönlendirme ve Temel İlke
              </Text>
              <Paragraph style={{ margin: '6px 0 0 0', fontSize: 13, color: '#78350F' }}>
                {hintTexts[1] || 'Konunun temel farmakolojik veya klinik ilkesini göz önüne getirin; kaynak belgede belirtilen kuralları hatırlayın.'}
              </Paragraph>
            </Card>

            {/* Stage 2 */}
            {currentHintStage >= 2 ? (
              <Card
                size="small"
                bordered
                style={{
                  borderRadius: 8,
                  backgroundColor: '#FEF3C7',
                  borderColor: '#FDE68A',
                }}
              >
                <Text strong style={{ color: '#92400E' }}>
                  2. Kademe: Akıl Yürütme ve Mantıksal İlişki
                </Text>
                <Paragraph style={{ margin: '6px 0 0 0', fontSize: 13, color: '#78350F' }}>
                  {hintTexts[2] || 'Soruyu ara adımlara bölün. Verilen parametrelerden çıkarılacak ilk mantıksal sonuç nedir?'}
                </Paragraph>
              </Card>
            ) : (
              <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                2. Kademe (Akıl Yürütme) henüz açılmadı.
              </div>
            )}

            {/* Stage 3 */}
            {currentHintStage >= 3 ? (
              <Card
                size="small"
                bordered
                style={{
                  borderRadius: 8,
                  backgroundColor: '#FEF3C7',
                  borderColor: '#FDE68A',
                }}
              >
                <Text strong style={{ color: '#92400E' }}>
                  3. Kademe: Uygulama ve Çözüm Adımı
                </Text>
                <Paragraph style={{ margin: '6px 0 0 0', fontSize: 13, color: '#78350F' }}>
                  {hintTexts[3] || 'Temel klinik sınırlamalar veya formül değişkenleriyle çelişen seçenekleri eleyerek çözüme ulaşın.'}
                </Paragraph>
              </Card>
            ) : (
              <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                3. Kademe (Uygulama) henüz açılmadı.
              </div>
            )}
          </Space>
        </div>
      </Modal>
    </div>
  );
};
