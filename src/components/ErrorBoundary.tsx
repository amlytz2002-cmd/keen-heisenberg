import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Space } from 'antd';
import { ReloadOutlined, HomeOutlined, ClearOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CENNA.live UI Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleClearAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clear exception:', e);
    }
    window.location.href = '/auth/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#F8FAFC',
          }}
        >
          <Result
            status="warning"
            title="Beklenmeyen Bir Hata Oluştu / Something went wrong"
            subTitle="Sayfa yüklenirken bir render hatası meydana geldi. Aşağıdaki seçenekleri kullanarak sayfayı yenileyebilir veya sıfırlayabilirsiniz."
            extra={
              <Space direction="vertical" align="center" size="middle">
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={this.handleReload}
                    size="large"
                    style={{ backgroundColor: '#2563EB', borderRadius: 8 }}
                  >
                    Sayfayı Yenile (Reload)
                  </Button>
                  <Button
                    icon={<HomeOutlined />}
                    onClick={this.handleGoHome}
                    size="large"
                    style={{ borderRadius: 8 }}
                  >
                    Ana Sayfaya Dön (Home)
                  </Button>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={this.handleClearAndReset}
                    size="large"
                    danger
                    style={{ borderRadius: 8 }}
                  >
                    Oturumu Sıfırla (Reset Session)
                  </Button>
                </Space>

                {this.state.error && (
                  <Paragraph
                    style={{
                      maxWidth: 600,
                      textAlign: 'left',
                      marginTop: 24,
                      padding: 12,
                      background: '#F1F5F9',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: '#475569',
                      overflowX: 'auto',
                    }}
                  >
                    <Text strong style={{ color: '#DC2626' }}>
                      {this.state.error.name}: {this.state.error.message}
                    </Text>
                  </Paragraph>
                )}
              </Space>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
