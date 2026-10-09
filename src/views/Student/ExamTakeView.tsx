import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
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
  Divider,
} from 'antd';
import {
  ClockCircleOutlined,
  FlagOutlined,
  LeftOutlined,
  RightOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { api } from '../../lib/api';

const { Title, Paragraph } = Typography;

export const ExamTakeView: React.FC = () => {
  const { params, searchParams, navigate } = useRouter();
  const examId = params.id;
  const initialAttemptId = searchParams.get('attemptId');

  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId);
  const [deadlineAt, setDeadlineAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: any }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<{ [questionId: string]: boolean }>({});
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examOverMessage, setExamOverMessage] = useState<string | null>(null);

  // Initialize or resume attempt
  useEffect(() => {
    if (!examId) return;

    const initExam = async () => {
      setLoading(true);
      try {
        const res = await api.exams.start(examId);
        if (res.success && res.data) {
          setExamData(res.data.exam);
          setAttemptId(res.data.attempt_id);
          const deadline = new Date(res.data.deadline_at);
          setDeadlineAt(deadline);

          const diffSec = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
          setSecondsRemaining(diffSec);

          // Populate existing answers if resuming
          if (res.data.existing_answers) {
            setUserAnswers(res.data.existing_answers);
          }
        } else {
          setExamOverMessage(res.error || 'Failed to initialize exam.');
        }
      } catch (err: any) {
        setExamOverMessage(err.message || 'Error connecting to exam server');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [examId]);

  // Real-time server-synced countdown timer
  useEffect(() => {
    if (!deadlineAt) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((deadlineAt.getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        // Time expired! Auto-submit
        handleFinalSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineAt]);

  // Periodic autosave
  const saveAnswersToServer = async () => {
    if (!attemptId) return;
    setIsAutosaving(true);
    try {
      const formattedAnswers = Object.entries(userAnswers).map(([qid, ans]) => ({
        question_id: qid,
        answer_payload: ans,
      }));

      await api.exams.saveAnswers(attemptId, formattedAnswers);
      setLastSavedTime(new Date());
    } catch (e) {
      console.warn('Autosave warning:', e);
    } finally {
      setIsAutosaving(false);
    }
  };

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveAnswersToServer();
    }, 25000); // Autosave every 25 seconds

    return () => clearInterval(autoSaveInterval);
  }, [userAnswers, attemptId]);

  const questions = examData?.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleAnswerSelect = (val: any) => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const toggleFlagCurrent = () => {
    if (!currentQuestion) return;
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleFinalSubmit = async (_forcedByTimeout: boolean = false) => {
    if (!attemptId) return;
    setIsSubmitting(true);
    try {
      // First ensure latest answers saved
      await saveAnswersToServer();

      // Submit
      const res = await api.exams.submit(attemptId);
      if (res.success && res.data) {
        navigate(`/app/exam-attempts/${attemptId}/results`);
      } else {
        setExamOverMessage(res.error || 'Failed to submit exam.');
      }
    } catch (err: any) {
      setExamOverMessage(err.message || 'Error submitting exam');
    } finally {
      setIsSubmitting(false);
      setSubmitConfirmOpen(false);
    }
  };

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Connecting to secure exam engine...</Paragraph>
      </div>
    );
  }

  if (examOverMessage) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center' }}>
          <Alert message={examOverMessage} type="error" showIcon style={{ marginBottom: 16 }} />
          <Button type="primary" onClick={() => navigate('/app/exams')}>
            Return to Exam Center
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Paragraph>No questions available for this exam.</Paragraph>
        <Button onClick={() => navigate('/app/exams')}>Back</Button>
      </div>
    );
  }

  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[k] !== undefined && userAnswers[k] !== ''
  ).length;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 16px 64px' }}>
      {/* Top Banner: Exam Title, Real-time Countdown, Autosave status */}
      <Card
        bordered
        style={{
          borderRadius: 14,
          borderColor: secondsRemaining < 300 ? '#FCA5A5' : '#E2E8F0',
          backgroundColor: secondsRemaining < 300 ? '#FEF2F2' : '#FFFFFF',
          marginBottom: 20,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Tag color="blue">{examData?.title || 'Academic Exam'}</Tag>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
              Question {currentIndex + 1} of {questions.length} · {answeredCount} Answered
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Autosave status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <SaveOutlined />
              <span>{isAutosaving ? 'Saving answers...' : `Saved at ${lastSavedTime.toLocaleTimeString()}`}</span>
            </div>

            {/* Countdown Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                backgroundColor: secondsRemaining < 300 ? '#DC2626' : '#1E293B',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: '1px',
              }}
            >
              <ClockCircleOutlined />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Main Question Column */}
        <Col xs={24} lg={17}>
          <Card
            bordered
            style={{
              borderRadius: 16,
              borderColor: '#E2E8F0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
            bodyStyle={{ padding: 28 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Tag color="cyan">Question #{currentIndex + 1}</Tag>
              <Button
                type={flaggedQuestions[currentQuestion.id] ? 'primary' : 'default'}
                icon={<FlagOutlined />}
                onClick={toggleFlagCurrent}
                style={{
                  borderRadius: 6,
                  backgroundColor: flaggedQuestions[currentQuestion.id] ? '#D97706' : undefined,
                  borderColor: flaggedQuestions[currentQuestion.id] ? '#D97706' : undefined,
                }}
              >
                {flaggedQuestions[currentQuestion.id] ? 'Flagged for Review' : 'Flag Question'}
              </Button>
            </div>

            <Title level={4} style={{ color: '#0F172A', lineHeight: 1.6, marginBottom: 28 }}>
              {currentQuestion.stem}
            </Title>

            {/* Inputs based on question type */}
            {currentQuestion.question_type === 'single_choice' && (
              <Radio.Group
                value={userAnswers[currentQuestion.id]}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {currentQuestion.options?.map((opt: any) => (
                  <Radio
                    key={opt.key}
                    value={opt.key}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: userAnswers[currentQuestion.id] === opt.key ? '2px solid #2563EB' : '1px solid #E2E8F0',
                      backgroundColor: userAnswers[currentQuestion.id] === opt.key ? '#EFF6FF' : '#FFFFFF',
                      fontSize: 15,
                    }}
                  >
                    <strong>{opt.key}.</strong> {opt.text}
                  </Radio>
                ))}
              </Radio.Group>
            )}

            {currentQuestion.question_type === 'multiple_choice' && (
              <Checkbox.Group
                value={userAnswers[currentQuestion.id] || []}
                onChange={(val) => handleAnswerSelect(val)}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {currentQuestion.options?.map((opt: any) => (
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

            {currentQuestion.question_type === 'numeric' && (
              <div>
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter numeric response"
                  value={userAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  size="large"
                  style={{ maxWidth: 300, borderRadius: 8 }}
                />
              </div>
            )}

            {currentQuestion.question_type === 'short_answer' && (
              <Input.TextArea
                rows={4}
                placeholder="Type your response..."
                value={userAnswers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                style={{ borderRadius: 8 }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36 }}>
              <Button
                icon={<LeftOutlined />}
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((idx) => idx - 1)}
                style={{ borderRadius: 8 }}
              >
                Previous
              </Button>
              <Space>
                {currentIndex + 1 < questions.length ? (
                  <Button
                    type="primary"
                    icon={<RightOutlined />}
                    onClick={() => setCurrentIndex((idx) => idx + 1)}
                    style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => setSubmitConfirmOpen(true)}
                    style={{ backgroundColor: '#059669', borderColor: '#059669', borderRadius: 8 }}
                  >
                    Review & Submit Exam
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        </Col>

        {/* Question Palette Sidebar */}
        <Col xs={24} lg={7}>
          <Card
            bordered
            style={{ borderRadius: 16, borderColor: '#E2E8F0' }}
            title="Question Palette"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
              {questions.map((q: any, i: number) => {
                const isAnswered =
                  userAnswers[q.id] !== undefined && userAnswers[q.id] !== '';
                const isFlagged = flaggedQuestions[q.id];
                const isCurrent = i === currentIndex;

                let bg = '#F1F5F9';
                let color = '#475569';
                let border = '1px solid #CBD5E1';

                if (isCurrent) {
                  border = '2px solid #2563EB';
                }
                if (isAnswered) {
                  bg = '#EFF6FF';
                  color = '#2563EB';
                }
                if (isFlagged) {
                  bg = '#FEF3C7';
                  color = '#B45309';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    style={{
                      height: 40,
                      borderRadius: 8,
                      border,
                      backgroundColor: bg,
                      color,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {i + 1}
                    {isFlagged && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: '#D97706',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#64748B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#EFF6FF', border: '1px solid #93C5FD' }} />
                <span>Answered ({answeredCount})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }} />
                <span>Flagged for review ({Object.values(flaggedQuestions).filter(Boolean).length})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1' }} />
                <span>Unanswered ({questions.length - answeredCount})</span>
              </div>
            </div>

            <Divider style={{ margin: '20px 0' }} />

            <Button
              block
              size="large"
              type="primary"
              onClick={() => setSubmitConfirmOpen(true)}
              style={{ backgroundColor: '#059669', borderColor: '#059669', borderRadius: 8, fontWeight: 600 }}
            >
              Submit Exam Now
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Submit Confirmation Modal */}
      <Modal
        title="Confirm Exam Submission"
        open={submitConfirmOpen}
        onCancel={() => setSubmitConfirmOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setSubmitConfirmOpen(false)}>
            Back to Questions
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={isSubmitting}
            onClick={() => handleFinalSubmit(false)}
            style={{ backgroundColor: '#059669', borderColor: '#059669' }}
          >
            Confirm & Grade Attempt
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <Paragraph>
            Are you sure you want to finalize and submit your exam?
          </Paragraph>
          <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div><strong>Questions Answered:</strong> {answeredCount} of {questions.length}</div>
            <div><strong>Unanswered Questions:</strong> {questions.length - answeredCount}</div>
            <div><strong>Flagged Questions:</strong> {Object.values(flaggedQuestions).filter(Boolean).length}</div>
          </div>
          {questions.length - answeredCount > 0 && (
            <Alert
              message="Unanswered Questions Warning"
              description="You have unanswered questions. Any unanswered questions will receive zero points."
              type="warning"
              showIcon
              style={{ marginTop: 12, borderRadius: 6 }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};
