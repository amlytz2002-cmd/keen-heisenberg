import React, { useEffect, useState } from 'react';
import { Card, Result, Button, Spin, Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

const { Title, Paragraph } = Typography;

export const InviteRedeemView: React.FC = () => {
  const { params, navigate } = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [classroomData, setClassroomData] = useState<any>(null);

  const token = params.token;

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus('error');
      setErrorMessage('Missing invitation token.');
      return;
    }

    if (!user) {
      // Must authenticate first
      return;
    }

    const redeem = async () => {
      setLoading(true);
      const res = await api.classrooms.redeemInvitation(token);
      setLoading(false);
      if (res.success) {
        setStatus('success');
        setClassroomData(res.data);
      } else {
        setStatus('error');
        setErrorMessage(res.error || 'Failed to redeem invitation.');
      }
    };

    redeem();
  }, [token, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16, color: '#64748B' }}>Verifying classroom invitation...</Paragraph>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, textAlign: 'center', borderColor: '#E2E8F0' }}>
          <TeamOutlined style={{ fontSize: 48, color: '#2563EB', marginBottom: 16 }} />
          <Title level={3}>Classroom Invitation</Title>
          <Paragraph style={{ color: '#64748B' }}>
            You have received an invitation to join an academic classroom on CENNA.live. Please sign in or register to
            accept.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/auth/login')}
            style={{ backgroundColor: '#2563EB', borderRadius: 8, height: 44, padding: '0 28px' }}
          >
            Sign In to Accept
          </Button>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ maxWidth: 540, margin: '60px auto', padding: '0 20px' }}>
        <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }}>
          <Result
            status="success"
            title="Classroom Enrolled Successfully!"
            subTitle={`You are now an active member of ${classroomData?.name || 'the classroom'}. You can immediately begin studying your assigned courses.`}
            extra={[
              <Button
                type="primary"
                key="today"
                onClick={() => navigate('/app/today')}
                style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
              >
                Go to Today's Study Hub
              </Button>,
              <Button key="classrooms" onClick={() => navigate('/app/classrooms')}>
                View Classrooms
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 540, margin: '60px auto', padding: '0 20px' }}>
      <Card bordered style={{ borderRadius: 16, borderColor: '#E2E8F0' }}>
        <Result
          status="error"
          title="Invitation Could Not Be Redeemed"
          subTitle={errorMessage || 'This invitation link may have expired, exceeded its usage limit, or is invalid.'}
          extra={[
            <Button
              type="primary"
              key="classrooms"
              onClick={() => navigate('/app/classrooms')}
              style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
            >
              My Classrooms
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};
