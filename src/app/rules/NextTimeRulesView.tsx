import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Typography, Button, Input, Empty, Space, Modal, message } from 'antd';
import { BulbOutlined, EditOutlined, CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabaseClient';

const { Title, Text, Paragraph } = Typography;

export interface NextTimeRuleItem {
  id: string;
  misconception_tag: string;
  rule_text_tr: string;
  times_shown: number;
  edited_by_user: boolean;
  created_at: string;
}

export const NextTimeRulesView: React.FC<{ localRules: NextTimeRuleItem[] }> = ({ localRules }) => {
  const [rules, setRules] = useState<NextTimeRuleItem[]>(localRules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newRuleText, setNewRuleText] = useState('');

  useEffect(() => {
    async function fetchRules() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('next_time_rules')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            setRules(data.map((r: any) => ({
              id: r.id,
              misconception_tag: r.misconception_tag,
              rule_text_tr: r.rule_text_tr,
              times_shown: r.times_shown || 0,
              edited_by_user: Boolean(r.edited_by_user),
              created_at: r.created_at || new Date().toISOString(),
            })));
          }
        }
      } catch (err) {
        console.warn('Using local next-time rules:', err);
      }
    }

    fetchRules();
  }, [localRules]);

  const handleStartEdit = (rule: NextTimeRuleItem) => {
    setEditingId(rule.id);
    setEditText(rule.rule_text_tr);
  };

  const handleSaveEdit = async (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, rule_text_tr: editText, edited_by_user: true } : r));
    setEditingId(null);
    try {
      await supabase.from('next_time_rules').update({ rule_text_tr: editText, edited_by_user: true }).eq('id', id);
      message.success('Klinik kural güncellendi.');
    } catch {
      // Local fallback
    }
  };

  const handleAddRule = async () => {
    if (!newRuleText.trim()) return;
    const newRule: NextTimeRuleItem = {
      id: Math.random().toString(),
      misconception_tag: newTag.trim() || 'MANUAL_RULE',
      rule_text_tr: newRuleText.trim(),
      times_shown: 0,
      edited_by_user: true,
      created_at: new Date().toISOString(),
    };
    setRules(prev => [newRule, ...prev]);
    setIsModalOpen(false);
    setNewTag('');
    setNewRuleText('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('next_time_rules').insert({
          user_id: session.user.id,
          misconception_tag: newRule.misconception_tag,
          rule_text_tr: newRule.rule_text_tr,
          edited_by_user: true,
        });
      }
    } catch {
      // Local fallback
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#0F172A' }}>
            <BulbOutlined style={{ marginRight: 8, color: '#D97706' }} />
            Gelecek Sefer Kurallarım (Next-Time Rules)
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
            Hatalı adımlardan sonra formüle ettiğiniz kişisel klinik hatırlatıcılar.
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setIsModalOpen(true)}
          style={{ background: '#D97706', borderColor: '#D97706', borderRadius: 6 }}
        >
          Yeni
        </Button>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {rules.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Henüz kaydedilmiş bir kural yok. Bir soruda kavram yanılgısına düştüğünüzde sistem otomatik olarak kural yazmanızı isteyecektir."
          />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={rules}
            renderItem={(rule) => (
              <List.Item
                key={rule.id}
                style={{
                  background: '#FFFBEB',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 10,
                  border: '1px solid #FDE68A',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Tag color="orange" style={{ fontWeight: 600 }}>{rule.misconception_tag}</Tag>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {rule.times_shown} kez gösterildi
                  </Text>
                </div>

                {editingId === rule.id ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input.TextArea
                      rows={2}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => handleSaveEdit(rule.id)}
                    >
                      Kaydet
                    </Button>
                  </Space>
                ) : (
                  <div>
                    <Paragraph style={{ fontSize: 13, color: '#92400E', margin: '4px 0 8px 0', lineHeight: 1.5 }}>
                      "{rule.rule_text_tr}"
                    </Paragraph>
                    <div style={{ textAlign: 'right' }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleStartEdit(rule)}
                        style={{ padding: 0, fontSize: 12, color: '#B45309' }}
                      >
                        Düzenle
                      </Button>
                    </div>
                  </div>
                )}
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="Yeni Klinik Kural Ekle"
        open={isModalOpen}
        onOk={handleAddRule}
        onCancel={() => setIsModalOpen(false)}
        okText="Ekle"
        cancelText="Vazgeç"
      >
        <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
          <Text strong style={{ fontSize: 13 }}>Kavram Yanılgısı Etiketi:</Text>
          <Input
            placeholder="Örn: MISSED_FEMALE_FACTOR_0_85"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <Text strong style={{ fontSize: 13, marginTop: 8 }}>Kural Metniniz:</Text>
          <Input.TextArea
            rows={3}
            placeholder="Gelecek sefer bu soru tipiyle karşılaştığımda..."
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  );
};
