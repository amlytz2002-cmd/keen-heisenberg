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

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      try {
        const res = await api.study.getSession();
        if (res.success && res.data) {
          setSessionData(res.data);
          setStartTime(Date.now());
        }
      } catch (err) {
        console.error('Error fetching study session:', err);
      } finally {
        setLoading(false);
      }
    };

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
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Initializing retrieval session...</Paragraph>
      </div>
    );
  }

  if (!activeQuestion) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#059669', marginBottom: 16 }} />
          <Title level={3}>Session Finished</Title>
          <Paragraph style={{ color: '#64748B' }}>
            You have completed all scheduled retrieval questions for this concept!
          </Paragraph>
          <Button
            type="primary"
            onClick={() => navigate('/app/today')}
            style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
          >
            Return to Today
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px 64px' }}>
      {/* Session Progress Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Tag color="blue">Question {currentQuestionIndex + 1} of {questions.length}</Tag>
          <Text strong style={{ marginLeft: 8, color: '#334155' }}>
            {concept?.name || 'Active Concept'}
          </Text>
        </div>
        <Button size="small" onClick={() => navigate('/app/today')}>
          Exit Session
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
            borderColor: '#E2E8F0',
            backgroundColor: '#F8FAFC',
            marginBottom: 20,
          }}
          bodyStyle={{ padding: '16px 20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
              Concept: {concept.name}
            </span>
            <Tag color="cyan">Target 85%</Tag>
          </div>
          <Paragraph style={{ fontSize: 13, color: '#475569', margin: '0 0 8px 0', lineHeight: 1.6 }}>
            {concept.description}
          </Paragraph>
          {concept.sources && concept.sources.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <FileTextOutlined />
              <span>
                Source: <strong>{concept.sources[0]?.resource_title || 'Course Textbook'}</strong> (Page {concept.sources[0]?.page_number || '1'}, Paragraph {concept.sources[0]?.paragraph_index || '1'})
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
          borderColor: '#E2E8F0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: 28 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <Tag color="purple" style={{ textTransform: 'uppercase', borderRadius: 4 }}>
            {activeQuestion.question_type?.replace('_', ' ') || 'QUESTION'}
          </Tag>
          <Button
            icon={<BulbOutlined style={{ color: '#D97706' }} />}
            onClick={openHintModal}
            style={{ borderRadius: 6, borderColor: '#FDE68A', backgroundColor: '#FEF3C7', color: '#92400E' }}
          >
            Socratic Hint ({hintsUsedCount}/3)
          </Button>
        </div>

        <Title level={4} style={{ color: '#0F172A', lineHeight: 1.5, marginBottom: 24 }}>
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
                      border: userAnswer === opt.key ? '2px solid #2563EB' : '1px solid #E2E8F0',
                      backgroundColor: userAnswer === opt.key ? '#EFF6FF' : '#FFFFFF',
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
                {activeQuestion.options?.map((opt: any) => (
                  <Checkbox
                    key={opt.key}
                    value={opt.key}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      fontSize: 15,
                      margin: 0,
                    }}
                  >
                    <strong>{opt.key}.</strong> {opt.text}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            )}

            {activeQuestion.question_type === 'numeric' && (
              <div>
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter numeric calculation result"
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
                placeholder="Type your answer concisely..."
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
              Submit Answer
            </Button>
          </div>
        ) : (
          /* Answer Result Feedback */
          <div>
            <Alert
              message={answerResult.is_correct ? 'Correct! Well Done.' : 'Incorrect Response'}
              description={
                <div>
                  <Paragraph style={{ margin: '8px 0 12px 0', fontSize: 14, color: '#334155' }}>
                    {answerResult.explanation || activeQuestion.explanation}
                  </Paragraph>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                    <Tag color={answerResult.is_correct ? 'green' : 'volcano'}>
                      Mastery: {answerResult.mastery_score || 75}%
                    </Tag>
                    {answerResult.next_review_days && (
                      <Tag color="purple">
                        Next Review in {answerResult.next_review_days} {answerResult.next_review_days === 1 ? 'day' : 'days'}
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
              {currentQuestionIndex + 1 < questions.length ? 'Continue to Next Question' : 'Finish Session'}
            </Button>
          </div>
        )}
      </Card>

      {/* Socratic Hint Progression Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BulbOutlined style={{ color: '#D97706' }} />
            <span>Socratic Hint Progression Ladder</span>
          </div>
        }
        open={hintModalOpen}
        onCancel={() => setHintModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setHintModalOpen(false)}>
            Close
          </Button>,
          currentHintStage < 3 && (
            <Button
              key="next_hint"
              type="primary"
              loading={requestingHint}
              onClick={() => handleRequestHint(currentHintStage + 1)}
              style={{ backgroundColor: '#D97706', borderColor: '#D97706' }}
            >
              Unlock Stage {currentHintStage + 1} Hint
            </Button>
          ),
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <Paragraph style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
            Graduated hints provide guidance without disclosing the final answer, reinforcing active retrieval.
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
                Stage 1: Orientation (Principle)
              </Text>
              <Paragraph style={{ margin: '6px 0 0 0', fontSize: 13, color: '#78350F' }}>
                {hintTexts[1] || 'Foundational formula or physiological principle needed to approach this item.'}
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
                  Stage 2: Reasoning (Relationships)
                </Text>
                <Paragraph style={{ margin: '6px 0 0 0', fontSize: 13, color: '#78350F' }}>
                  {hintTexts[2] || 'How the known parameters influence each other and eliminate incorrect paths.'}
                </Paragraph>
              </Card>
            ) : (
              <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                Stage 2 (Reasoning) is locked.
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
                  Stage 3: Application (Substitution)
                </Text>
                <Paragraph style={{ margin: '6px 0 0 0', fontSize: 13, color: '#78350F' }}>
                  {hintTexts[3] || 'Exact step-by-step substitution instructions.'}
                </Paragraph>
              </Card>
            ) : (
              <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                Stage 3 (Application) is locked.
              </div>
            )}
          </Space>
        </div>
      </Modal>
    </div>
  );
};
