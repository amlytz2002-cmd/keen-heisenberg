import React, { useState } from 'react';
import { Card, InputNumber, Button, Slider, Alert, Drawer, Steps, Typography, Space, Tag, Input, Divider, Radio } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ArrowRightOutlined, BulbOutlined, SafetyOutlined, MessageOutlined, SendOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { CockcroftGaultEngine, PatientContext } from '../../lib/engines/cockcroftGault';
import { GentamicinEngine } from '../../lib/engines/gentamicin';
import { TheophyllineEngine } from '../../lib/engines/theophylline';
import { BaseEvaluationNode } from '../../lib/engines/types';
import { scheduleNextReview } from '../../lib/engines/fsrs';
import { requestTutorTurn } from '../../lib/tutorClient';
import { SocraticTurn } from '../../worker/socraticFSM';
import { supabase } from '../../lib/supabaseClient';
import { ErrorEventRecord } from '../clinic/ErrorClinic';
import { NextTimeRuleItem } from '../rules/NextTimeRulesView';

const { Title, Text, Paragraph } = Typography;

interface SocraticMessage {
  sender: 'preceptor' | 'student';
  text: string;
}

export interface CalculationDrillProps {
  onErrorLogged?: (err: ErrorEventRecord) => void;
  onRuleLogged?: (rule: NextTimeRuleItem) => void;
}

export const CalculationDrill: React.FC<CalculationDrillProps> = ({ onErrorLogged, onRuleLogged }) => {
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);

  // Case 1 State (Cockcroft-Gault)
  const [patient] = useState<PatientContext>({
    age: 64,
    sex: 'F',
    heightCm: 160,
    tbwKg: 85,
    scrMgDl: 1.4,
  });
  const [stepsCase1, setStepsCase1] = useState<{ ibw?: number; weightUsed?: number; finalCrCl?: number }>({});

  // Case 2 State (Gentamicin)
  const [stepsCase2, setStepsCase2] = useState<{ deltaT?: number; ke?: number; halfLife?: number }>({});

  // Case 3 State (Theophylline)
  const [stepsCase3, setStepsCase3] = useState<{ targetMassMg?: number; saltFactor?: number; loadingDoseMg?: number }>({ saltFactor: 1.0 });

  // Shared Drill UI State
  const [confidence, setConfidence] = useState<number>(3);
  const [evalResults, setEvalResults] = useState<BaseEvaluationNode<string>[] | null>(null);
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
  const [fsrsResult, setFsrsResult] = useState<{ stability: number; intervalDays: number } | null>(null);

  const cgEngine = new CockcroftGaultEngine();
  const gentEngine = new GentamicinEngine();
  const theoEngine = new TheophyllineEngine();

  const handleRunEvaluation = async () => {
    let results: BaseEvaluationNode<string>[] = [];
    let isAllCorrect = false;

    if (activeCaseIdx === 0) {
      // Case 1: Cockcroft-Gault
      results = cgEngine.evaluateDerivation(patient, stepsCase1);
      isAllCorrect = results.every((r) => r.isCorrect);
    } else if (activeCaseIdx === 1) {
      // Case 2: Gentamicin (C1=8 mg/L at t1=2h, C2=2 mg/L at t2=6h)
      const res = gentEngine.evaluate(
        { t1Hours: 2, c1MgL: 8, t2Hours: 6, c2MgL: 2 },
        stepsCase2
      );
      results = res.stepEvaluations;
      isAllCorrect = res.isFullyCorrect;
    } else {
      // Case 3: Theophylline (Vd=35 L, Ctarget=15 mg/L, Anhydrous S=1.0)
      const res = theoEngine.evaluate(
        { vdL: 35, cTargetMgL: 15, saltForm: 'theophylline_anhydrous' },
        stepsCase3
      );
      results = res.stepEvaluations;
      isAllCorrect = res.isFullyCorrect;
    }

    setEvalResults(results);

    // FSRS Spaced Repetition calculation
    const schedule = scheduleNextReview(
      { stability: 1.0, difficulty: 5.0 },
      { isCorrect: isAllCorrect, confidence }
    );
    setFsrsResult({
      stability: schedule.stability,
      intervalDays: schedule.intervalDays,
    });

    const hyper = schedule.isHypercorrection;
    setIsHypercorrection(hyper);

    const firstFailed = results.find((r) => !r.isCorrect);
    if (firstFailed && firstFailed.misconceptionTag) {
      setActiveMisconception(firstFailed.misconceptionTag);
      setTurnCount(1);
      setLoadingTutor(true);

      const conceptTitles = [
        'Cockcroft-Gault Klerens ve Ağırlık Seçimi',
        'Gentamisin Eliminasyon Hız Sabiti ve Yarı Ömür',
        'Teofilin Dağılım Hacmi ve Yükleme Dozu',
      ];

      const initialTurn: SocraticTurn = await requestTutorTurn({
        conceptName: conceptTitles[activeCaseIdx],
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

      // Notify parent error clinic
      if (onErrorLogged) {
        onErrorLogged({
          id: Math.random().toString(),
          concept_name: conceptTitles[activeCaseIdx],
          error_family: 'DAG_NODE_FAILURE',
          misconception_tag: firstFailed.misconceptionTag,
          failed_node: String(firstFailed.nodeId),
          is_hypercorrection: hyper,
          resolved: false,
          created_at: new Date().toISOString(),
        });
      }
    } else {
      setSocraticTurns([]);
      setActiveMisconception('');
    }

    // Persist to Supabase if session active
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('attempts').insert({
          user_id: session.user.id,
          submitted_answer: JSON.stringify(activeCaseIdx === 0 ? stepsCase1 : activeCaseIdx === 1 ? stepsCase2 : stepsCase3),
          is_correct: isAllCorrect,
          confidence,
          latency_ms: 4000,
          hint_level: 0,
          assisted: false,
        });
      }
    } catch (err) {
      console.warn('Telemetry persistence:', err);
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
      conceptName: 'Farmakokinetik Hesaplama Adımları',
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
    const ruleItem: NextTimeRuleItem = {
      id: Math.random().toString(),
      misconception_tag: activeMisconception || 'HYPERCORRECTION_RULE',
      rule_text_tr: nextTimeRule.trim(),
      times_shown: 0,
      edited_by_user: true,
      created_at: new Date().toISOString(),
    };

    if (onRuleLogged) {
      onRuleLogged(ruleItem);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('next_time_rules').insert({
          user_id: session.user.id,
          misconception_tag: ruleItem.misconception_tag,
          rule_text_tr: ruleItem.rule_text_tr,
          edited_by_user: true,
        });
      }
    } catch {
      // Local fallback
    }
    setRuleSaved(true);
  };

  const isAllCorrect = evalResults?.every((r) => r.isCorrect) ?? false;
  const firstFailingIdx = evalResults ? evalResults.findIndex((r) => !r.isCorrect) : -1;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px', minHeight: '90vh' }}>
      {/* Case Navigation Header */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button
            size="small"
            icon={<LeftOutlined />}
            disabled={activeCaseIdx === 0}
            onClick={() => {
              setActiveCaseIdx((prev) => prev - 1);
              setEvalResults(null);
            }}
          />
          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
            Vaka {activeCaseIdx + 1} / 3: {activeCaseIdx === 0 ? 'Cockcroft-Gault' : activeCaseIdx === 1 ? 'Gentamisin' : 'Teofilin'}
          </Tag>
          <Button
            size="small"
            icon={<RightOutlined />}
            disabled={activeCaseIdx === 2}
            onClick={() => {
              setActiveCaseIdx((prev) => prev + 1);
              setEvalResults(null);
            }}
          />
        </Space>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Dönem 3: Farmakokinetik
        </Text>
      </div>

      {/* Case Vignette Card */}
      {activeCaseIdx === 0 && (
        <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Title level={5} style={{ marginTop: 0, marginBottom: 8, color: '#0F172A' }}>
            Vaka 1: Seftazidim Doz Ayarı ve CrCl
          </Title>
          <Paragraph style={{ color: '#334155', marginBottom: 12, fontSize: 14, lineHeight: 1.6 }}>
            <Text strong>64 yaşında kadın</Text> hasta yoğun bakımda izlenmektedir.<br />
            Boy: <Text strong>160 cm</Text>, Ağırlık: <Text strong>85 kg</Text>, Serum Kreatinin: <Text strong>1.4 mg/dL</Text>.
          </Paragraph>
          <Alert
            message="Cockcroft-Gault yöntemiyle hastanın kreatinin klerensini (CrCl) hesaplayınız."
            type="info"
            showIcon
            style={{ fontSize: 13, borderRadius: 8 }}
          />
        </Card>
      )}

      {activeCaseIdx === 1 && (
        <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Title level={5} style={{ marginTop: 0, marginBottom: 8, color: '#0F172A' }}>
            Vaka 2: Gentamisin Eliminasyon Hızı & Yarı Ömür
          </Title>
          <Paragraph style={{ color: '#334155', marginBottom: 12, fontSize: 14, lineHeight: 1.6 }}>
            Tek doz gentamisin IV infüzyonu sonrası plazma konsantrasyonu:<br />
            2. saatte (<Text strong>t1 = 2h</Text>): <Text strong>C1 = 8 mg/L</Text><br />
            6. saatte (<Text strong>t2 = 6h</Text>): <Text strong>C2 = 2 mg/L</Text>
          </Paragraph>
          <Alert
            message="Eliminasyon hız sabiti (ke) ve yarı ömrü (t1/2) hesaplayınız. ke = ln(C1/C2)/Δt, t1/2 = 0.693/ke"
            type="info"
            showIcon
            style={{ fontSize: 13, borderRadius: 8 }}
          />
        </Card>
      )}

      {activeCaseIdx === 2 && (
        <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Title level={5} style={{ marginTop: 0, marginBottom: 8, color: '#0F172A' }}>
            Vaka 3: Teofilin Dağılım Hacmi & IV Yükleme Dozu
          </Title>
          <Paragraph style={{ color: '#334155', marginBottom: 12, fontSize: 14, lineHeight: 1.6 }}>
            Dağılım hacmi <Text strong>Vd = 35 L</Text> olan bir hastada hedeflenen teofilin kararlı durum konsantrasyonu <Text strong>Ctarget = 15 mg/L</Text>'dir.<br />
            Teofilin anhidr (<Text strong>S = 1.0</Text>) için gereken IV yükleme dozu nedir?
          </Paragraph>
          <Alert
            message="Yükleme dozu formülü: D_L = (Vd × Ctarget) / S"
            type="info"
            showIcon
            style={{ fontSize: 13, borderRadius: 8 }}
          />
        </Card>
      )}

      {/* Step Scratchpad Input Card */}
      <Card
        title="Adım Adım Çözüm Scratchpad'i"
        bordered={false}
        style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {activeCaseIdx === 0 && (
            <>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>1. İdeal Vücut Ağırlığı (İVA) [kg]:</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                  placeholder="Örn: 52.38"
                  precision={2}
                  value={stepsCase1.ibw}
                  onChange={(val) => setStepsCase1((prev) => ({ ...prev, ibw: val ?? undefined }))}
                />
              </div>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>2. Formülde Kullanılacak Ağırlık [kg]:</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                  placeholder="TVA, İVA veya Düzeltilmiş VA (örn: 65.43)"
                  precision={2}
                  value={stepsCase1.weightUsed}
                  onChange={(val) => setStepsCase1((prev) => ({ ...prev, weightUsed: val ?? undefined }))}
                />
              </div>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>3. Nihai Kreatinin Klerensi [mL/dk]:</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                  placeholder="Nihai CrCl sonucunuz (örn: 41.93)"
                  precision={2}
                  value={stepsCase1.finalCrCl}
                  onChange={(val) => setStepsCase1((prev) => ({ ...prev, finalCrCl: val ?? undefined }))}
                />
              </div>
            </>
          )}

          {activeCaseIdx === 1 && (
            <>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>1. Zaman Farkı (Δt = t2 - t1) [saat]:</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                  placeholder="Örn: 4.00"
                  precision={2}
                  value={stepsCase2.deltaT}
                  onChange={(val) => setStepsCase2((prev) => ({ ...prev, deltaT: val ?? undefined }))}
                />
              </div>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>2. Eliminasyon Hız Sabiti (ke) [saat⁻¹]:</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                  placeholder="ke = ln(C1/C2) / Δt (örn: 0.35)"
                  precision={4}
                  value={stepsCase2.ke}
                  onChange={(val) => setStepsCase2((prev) => ({ ...prev, ke: val ?? undefined }))}
                />
              </div>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>3. Yarı Ömür (t1/2) [saat]:</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                  placeholder="t1/2 = 0.693 / ke (örn: 2.00)"
                  precision={2}
                  value={stepsCase2.halfLife}
                  onChange={(val) => setStepsCase2((prev) => ({ ...prev, halfLife: val ?? undefined }))}
                />
              </div>
            </>
          )}

          {activeCaseIdx === 2 && (
            <>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>1. Hedeflenen İlaç Kütlesi (Vd × Ctarget) [mg]:</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                  placeholder="35 L × 15 mg/L = 525 mg"
                  precision={2}
                  value={stepsCase3.targetMassMg}
                  onChange={(val) => setStepsCase3((prev) => ({ ...prev, targetMassMg: val ?? undefined }))}
                />
              </div>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>2. Tuz Faktörü (S):</Text>
                <Radio.Group
                  value={stepsCase3.saltFactor}
                  onChange={(e) => setStepsCase3((prev) => ({ ...prev, saltFactor: e.target.value }))}
                  style={{ marginTop: 4, width: '100%' }}
                >
                  <Radio.Button value={1.0} style={{ width: '50%', textAlign: 'center' }}>Teofilin Anhidr (S=1.0)</Radio.Button>
                  <Radio.Button value={0.8} style={{ width: '50%', textAlign: 'center' }}>Aminofilin (S=0.8)</Radio.Button>
                </Radio.Group>
              </div>
              <div>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>3. Gereken IV Yükleme Dozu [mg]:</Text>
                <InputNumber
                  style={{ width: '100%', marginTop: 4, borderRadius: 8 }}
                  placeholder="Nihai doz (örn: 525.00)"
                  precision={2}
                  value={stepsCase3.loadingDoseMg}
                  onChange={(val) => setStepsCase3((prev) => ({ ...prev, loadingDoseMg: val ?? undefined }))}
                />
              </div>
            </>
          )}

          <div style={{ marginTop: 8, padding: '10px 12px', background: '#F1F5F9', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: 500 }}>Cevap Güven Dereceniz:</Text>
              <Tag color={confidence >= 4 ? 'purple' : confidence === 3 ? 'blue' : 'orange'}>
                {confidence} / 5
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

      {/* Diagnostic & Socratic Dialogue Drawer */}
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
                description="Tüm ara adımları, formül dönüşümlerini ve klinik sabitleri eksiksiz uyguladınız."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            ) : (
              <Alert
                type="error"
                showIcon
                icon={<CloseCircleFilled style={{ color: '#DC2626', fontSize: 18 }} />}
                message="Hesaplama Hatası Tespit Edildi"
                description="Deterministik DAG motorumuz hatanın ilk oluştuğu basamağı izole etti."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {isHypercorrection && (
              <Alert
                type="warning"
                showIcon
                icon={<SafetyOutlined style={{ color: '#D97706', fontSize: 18 }} />}
                message="Hiper-Düzeltme Önceliği (Yüksek Güven + Hatalı Sonuç)"
                description="Hafıza konsolidasyonu için FSRS stabilitesi sıfırlandı. 24 saat sonra yeniden test edilecektir."
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {fsrsResult && (
              <Card size="small" style={{ marginBottom: 16, borderRadius: 8, background: '#EFF6FF', borderColor: '#BFDBFE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 12, color: '#1E40AF' }}>FSRS Bellek Güncellemesi:</Text>
                  <Tag color="blue">Stabilite: {fsrsResult.stability} gün | Sonraki Tekrar: {fsrsResult.intervalDays} gün</Tag>
                </div>
              </Card>
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
                        {res.nodeNameTr || `Adım ${idx + 1}`}
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
                    Sokratik Klinik Preseptör (Diyalog: {turnCount}/4)
                  </span>
                }
                size="small"
                style={{ borderRadius: 8, marginBottom: 16 }}
              >
                <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
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
                      placeholder="Gerekçenizi yazınız..."
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

            {/* Hypercorrection Next-Time Rule */}
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
                <Input.TextArea
                  rows={2}
                  placeholder="Bu hatayı tekrar yapmamak için klinik hatırlatıcı kuralınızı yazınız..."
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
                  {ruleSaved ? 'Kural Kaydedildi ✓' : 'Kuralı Kaydet'}
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
                if (activeCaseIdx < 2) {
                  setActiveCaseIdx((prev) => prev + 1);
                } else {
                  setActiveCaseIdx(0);
                }
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
              {activeCaseIdx < 2 ? 'Sonraki Vakaya Geç' : 'Vaka Döngüsünü Baştan Başlat'}
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};
