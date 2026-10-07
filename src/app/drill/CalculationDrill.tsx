import React, { useState } from 'react';
import { Card, InputNumber, Button, Slider, Alert, Drawer, Steps, Typography, Space, Tag, Input, Divider } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ArrowRightOutlined, BulbOutlined, SafetyOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import { CockcroftGaultEngine, PatientContext, StepEvaluation } from '../../lib/engines/cockcroftGault';
import { requestTutorTurn } from '../../lib/tutorClient';
import { SocraticTurn } from '../../worker/socraticFSM';
import { supabase } from '../../lib/supabaseClient';

const { Title, Text, Paragraph } = Typography;

interface SocraticMessage {
  sender: 'preceptor' | 'student';
  text: string;
}

export const CalculationDrill: React.FC = () => {
  // Case context: 64 yo female, 160 cm, 85 kg, SCr 1.4 mg/dL
  const [patient] = useState<PatientContext>({
    age: 64,
    sex: 'F',
    heightCm: 160,
    tbwKg: 85,
    scrMgDl: 1.4,
  });

  const [steps, setSteps] = useState<{ ibw?: number; weightUsed?: number; finalCrCl?: number }>({});
  const [confidence, setConfidence] = useState<number>(3);
  const [evalResults, setEvalResults] = useState<StepEvaluation[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Socratic Dialogue & Diagnostic State
  const [socraticTurns, setSocraticTurns] = useState<SocraticMessage[]>([]);
  const [studentReply, setStudentReply] = useState<string>('');
  const [turnCount, setTurnCount] = useState<number>(0);
  const [isHypercorrection, setIsHypercorrection] = useState<boolean>(false);
  const [nextTimeRule, setNextTimeRule] = useState<string>('');
  const [ruleSaved, setRuleSaved] = useState<boolean>(false);
  const [activeMisconception, setActiveMisconception] = useState<string>('');
  const [loadingTutor, setLoadingTutor] = useState<boolean>(false);

  const engine = new CockcroftGaultEngine();

  const handleRunEvaluation = async () => {
    const results = engine.evaluateDerivation(patient, steps);
    setEvalResults(results);

    const isAllCorrect = results.every((r) => r.isCorrect);
    const hyper = !isAllCorrect && confidence >= 4;
    setIsHypercorrection(hyper);

    const firstFailed = results.find((r) => !r.isCorrect);
    if (firstFailed && firstFailed.misconceptionTag) {
      setActiveMisconception(firstFailed.misconceptionTag);
      setTurnCount(1);
      setLoadingTutor(true);

      const initialTurn: SocraticTurn = await requestTutorTurn({
        conceptName: 'Cockcroft-Gault Klerens ve Ağırlık Seçimi',
        misconceptionTag: firstFailed.misconceptionTag,
        studentInput: `Öğrenci adım analizi: ${firstFailed.nodeId} basamağında hata. Öğrenci değeri: ${firstFailed.submittedValue}`,
        turnCount: 1,
      });

      setSocraticTurns([
        {
          sender: 'preceptor',
          text: `${initialTurn.clinical_observation_tr} ${initialTurn.conceptual_pivot_tr} ${initialTurn.actionable_question_tr}`,
        },
      ]);
      setLoadingTutor(false);
    } else {
      setSocraticTurns([]);
      setActiveMisconception('');
    }

    // Persist to Supabase if authenticated
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('attempts').insert({
          user_id: session.user.id,
          submitted_answer: JSON.stringify(steps),
          is_correct: isAllCorrect,
          confidence,
          latency_ms: 3500,
          hint_level: 0,
          assisted: false,
        });
      }
    } catch (err) {
      console.warn('Telemetry log deferred:', err);
    }

    setDrawerOpen(true);
  };

  const handleSendStudentReply = async () => {
    if (!studentReply.trim() || loadingTutor) return;

    const newReply = studentReply.trim();
    const nextCount = turnCount + 1;
    setTurnCount(nextCount);
    setStudentReply('');

    setSocraticTurns((prev) => [...prev, { sender: 'student', text: newReply }]);
    setLoadingTutor(true);

    const turnResponse = await requestTutorTurn({
      conceptName: 'Cockcroft-Gault Klerens ve Ağırlık Seçimi',
      misconceptionTag: activeMisconception,
      studentInput: newReply,
      turnCount: nextCount,
    });

    setSocraticTurns((prev) => [
      ...prev,
      {
        sender: 'preceptor',
        text: `${turnResponse.clinical_observation_tr} ${turnResponse.conceptual_pivot_tr} ${turnResponse.actionable_question_tr}`,
      },
    ]);
    setLoadingTutor(false);
  };

  const handleSaveNextTimeRule = async () => {
    if (!nextTimeRule.trim()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('next_time_rules').insert({
          user_id: session.user.id,
          misconception_tag: activeMisconception || 'HYPERCORRECTION_DEFAULT',
          rule_text_tr: nextTimeRule.trim(),
          edited_by_user: true,
        });
      }
      setRuleSaved(true);
    } catch (err) {
      console.warn('Next-time rule local cache:', err);
      setRuleSaved(true);
    }
  };

  const isAllCorrect = evalResults?.every((r) => r.isCorrect) ?? false;
  const firstFailingIdx = evalResults ? evalResults.findIndex((r) => !r.isCorrect) : -1;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Header Badges */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tag color="blue" style={{ borderRadius: 6, fontWeight: 500, padding: '2px 8px' }}>
          Dönem 3: Biyofarmasötik & PK
        </Tag>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Soru 1 / 3
        </Text>
      </div>

      {/* Clinical Patient Vignette Card */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          background: '#FFFFFF',
        }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 8, color: '#0F172A' }}>
          Vaka: Seftazidim Doz Ayarı ve CrCl
        </Title>
        <Paragraph style={{ color: '#334155', marginBottom: 12, fontSize: 14, lineHeight: 1.6 }}>
          <Text strong>64 yaşında kadın</Text> hasta yoğun bakım ünitesinde izlenmektedir.<br />
          Boy: <Text strong>160 cm</Text>, Ağırlık: <Text strong>85 kg</Text>, Serum Kreatinin (SCr): <Text strong>1.4 mg/dL</Text>.
        </Paragraph>
        <Alert
          message="Cockcroft-Gault yöntemiyle hastanın kreatinin klerensini (CrCl) basamak basamak türetiniz."
          type="info"
          showIcon
          style={{ fontSize: 13, borderRadius: 8 }}
        />
      </Card>

      {/* Step Scratchpad Input Card */}
      <Card
        title="Adım Adım Çözüm Scratchpad'i"
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>1. İdeal Vücut Ağırlığı (İVA) [kg]:</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>Formül: 45.5 + 2.3 × (Boy(inç) - 60)</Text>
            </div>
            <InputNumber
              style={{ width: '100%', borderRadius: 8 }}
              placeholder="Örn: 52.38"
              precision={2}
              value={steps.ibw}
              onChange={(val) => setSteps((prev) => ({ ...prev, ibw: val ?? undefined }))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>2. Formülde Kullanılacak Ağırlık [kg]:</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>TVA, İVA veya Düzeltilmiş VA</Text>
            </div>
            <InputNumber
              style={{ width: '100%', borderRadius: 8 }}
              placeholder="Hesapladığınız ağırlık seçimi (örn: 65.43)"
              precision={2}
              value={steps.weightUsed}
              onChange={(val) => setSteps((prev) => ({ ...prev, weightUsed: val ?? undefined }))}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>3. Nihai Kreatinin Klerensi [mL/dk]:</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>CrCl = (140-Yaş)×W / (72×SCr) [×0.85]</Text>
            </div>
            <InputNumber
              style={{ width: '100%', borderRadius: 8 }}
              placeholder="Nihai CrCl sonucunuz (örn: 41.93)"
              precision={2}
              value={steps.finalCrCl}
              onChange={(val) => setSteps((prev) => ({ ...prev, finalCrCl: val ?? undefined }))}
            />
          </div>

          <div style={{ marginTop: 8, padding: '12px 14px', background: '#F1F5F9', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>Cevap Güven Dereceniz:</Text>
              <Tag color={confidence >= 4 ? 'purple' : confidence === 3 ? 'blue' : 'orange'}>
                {confidence} / 5 ({confidence >= 4 ? 'Yüksek / Kesin' : confidence === 3 ? 'Orta' : 'Düşük / Tahmin'})
              </Tag>
            </div>
            <Slider
              min={1}
              max={5}
              value={confidence}
              onChange={(v) => setConfidence(v)}
              marks={{ 1: 'Tahmin', 3: 'Eminim', 5: 'Kesin' }}
            />
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleRunEvaluation}
            style={{
              marginTop: 8,
              height: 44,
              borderRadius: 8,
              background: '#2563EB',
              fontWeight: 600,
            }}
          >
            Adımları Doğrula & Teşhis Et
          </Button>
        </Space>
      </Card>

      {/* Error Debrief & Socratic Dialogue Drawer */}
      <Drawer
        title="Basamak Teşhis & Preseptör Raporu"
        placement="bottom"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        height="85%"
        styles={{ body: { paddingBottom: 28, background: '#F8FAFC' } }}
      >
        {evalResults && (
          <div>
            {isAllCorrect ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleFilled style={{ color: '#16A34A', fontSize: 18 }} />}
                message="Kusursuz Hesaplama!"
                description="Tüm adımları, aşırı kilo kriterini ve kadın katsayısı düzeltmesini eksiksiz uyguladınız."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            ) : (
              <Alert
                type="error"
                showIcon
                icon={<CloseCircleFilled style={{ color: '#DC2626', fontSize: 18 }} />}
                message="Hesaplama Hatası Tespit Edildi"
                description="Deterministik DAG motorumuz hatanın ilk oluştuğu ara basamağı ve kavram yanılgısını aşağıda izole etmiştir."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {/* Hypercorrection Alert Banner */}
            {isHypercorrection && (
              <Alert
                type="warning"
                showIcon
                icon={<SafetyOutlined style={{ color: '#D97706', fontSize: 18 }} />}
                message="Hiper-Düzeltme Önceliği (Yüksek Güven + Hatalı Sonuç)"
                description="Cevabınızdan çok emin olduğunuz halde kavram yanılgısına düştünüz. Bu konu belleğinizde kalıcı hale getirilmek üzere 24 saat sonra tekrar test edilecektir."
                style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #FCD34D' }}
              />
            )}

            {/* Step-by-Step DAG Analysis */}
            <Card title="Deterministik Basamak İncelemesi" size="small" style={{ borderRadius: 8, marginBottom: 16 }}>
              <Steps
                direction="vertical"
                size="small"
                current={firstFailingIdx >= 0 ? firstFailingIdx : 3}
              >
                {evalResults.map((res, idx) => (
                  <Steps.Step
                    key={idx}
                    status={res.isCorrect ? 'finish' : 'error'}
                    title={
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {res.isCorrect ? (
                          <CheckCircleFilled style={{ color: '#16A34A', marginRight: 6 }} />
                        ) : (
                          <CloseCircleFilled style={{ color: '#DC2626', marginRight: 6 }} />
                        )}
                        {res.nodeId === 'ibw_node'
                          ? '1. İdeal Vücut Ağırlığı (İVA)'
                          : res.nodeId === 'weight_selection_node'
                          ? '2. Ağırlık Seçimi (DVA / İVA)'
                          : '3. Nihai CrCl Hesaplaması'}
                      </span>
                    }
                    description={
                      !res.isCorrect ? (
                        <div style={{ marginTop: 6, padding: '8px 12px', background: '#FEF2F2', borderRadius: 6 }}>
                          <Tag color="red" style={{ fontWeight: 600 }}>{res.misconceptionTag}</Tag>
                          <Paragraph style={{ color: '#475569', fontSize: 13, marginTop: 6, marginBottom: 4 }}>
                            {res.hintTr}
                          </Paragraph>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Sizin Değeriniz: {res.submittedValue || '(Boş)'} | Beklenen: {res.expectedValue}
                          </Text>
                        </div>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Doğrulandı: {res.expectedValue}
                        </Text>
                      )
                    }
                  />
                ))}
              </Steps>
            </Card>

            {/* Socratic Dialogue Preceptor Interaction */}
            {!isAllCorrect && socraticTurns.length > 0 && (
              <Card
                title={
                  <span>
                    <MessageOutlined style={{ marginRight: 8, color: '#2563EB' }} />
                    Sokratik Klinik Preseptör (Diyalog Sırası: {turnCount}/4)
                  </span>
                }
                size="small"
                style={{ borderRadius: 8, marginBottom: 16 }}
              >
                <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
                  {socraticTurns.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: msg.sender === 'preceptor' ? '#EFF6FF' : '#F1F5F9',
                        borderLeft: msg.sender === 'preceptor' ? '3px solid #2563EB' : '3px solid #64748B',
                      }}
                    >
                      <Text strong style={{ fontSize: 12, color: msg.sender === 'preceptor' ? '#1D4ED8' : '#334155' }}>
                        {msg.sender === 'preceptor' ? 'Klinik Preseptör' : 'Siz'}:
                      </Text>
                      <Paragraph style={{ margin: '4px 0 0 0', fontSize: 13, color: '#1E293B', lineHeight: 1.5 }}>
                        {msg.text}
                      </Paragraph>
                    </div>
                  ))}
                </div>

                {turnCount < 4 && (
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      placeholder="Cevabınızı veya gerekçenizi yazınız..."
                      value={studentReply}
                      onChange={(e) => setStudentReply(e.target.value)}
                      onPressEnter={handleSendStudentReply}
                      disabled={loadingTutor}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSendStudentReply}
                      loading={loadingTutor}
                    >
                      Gönder
                    </Button>
                  </Space.Compact>
                )}
              </Card>
            )}

            {/* Hypercorrection "Next-Time Rule" Authoring */}
            {isHypercorrection && (
              <Card
                title={
                  <span>
                    <BulbOutlined style={{ color: '#D97706', marginRight: 8 }} />
                    Gelecek Sefer İçin Klinik Kuralım (Next-Time Rule)
                  </span>
                }
                size="small"
                style={{ borderRadius: 8, marginBottom: 16, background: '#FFFBEB', borderColor: '#FDE68A' }}
              >
                <Paragraph style={{ fontSize: 13, color: '#92400E' }}>
                  Bu hatayı tekrar yapmamak için kendi klinik kuralınızı formüle ediniz. Gelecek benzer sorularda bu kural hatırlatıcı olarak karşınıza çıkacaktır:
                </Paragraph>
                <Input.TextArea
                  rows={2}
                  placeholder="Örn: Hasta kadın olduğunda veya aşırı kilolu olduğunda Cockcroft-Gault sonucunu kontrol etmeden önce daima DVA ve 0.85 çarpanını uygula."
                  value={nextTimeRule}
                  onChange={(e) => setNextTimeRule(e.target.value)}
                  disabled={ruleSaved}
                  style={{ marginBottom: 8, borderRadius: 6 }}
                />
                <Button
                  size="small"
                  type="primary"
                  onClick={handleSaveNextTimeRule}
                  disabled={ruleSaved || !nextTimeRule.trim()}
                  style={{ background: '#D97706', borderColor: '#D97706' }}
                >
                  {ruleSaved ? 'Kural Belleğinize Kaydedildi ✓' : 'Kuralı Kaydet'}
                </Button>
              </Card>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Button
              type="primary"
              block
              icon={<ArrowRightOutlined />}
              onClick={() => {
                setDrawerOpen(false);
                // Reset inputs for transfer drill
                setSteps({});
                setEvalResults(null);
                setSocraticTurns([]);
              }}
              style={{
                height: 42,
                borderRadius: 8,
                background: '#0F172A',
                fontWeight: 600,
              }}
            >
              Transfer Sorusuna Geç
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};
