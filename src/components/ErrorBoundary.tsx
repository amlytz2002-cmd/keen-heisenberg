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
    console.error('CENNA.live UI Error Boundary yakalanan hata:', error, errorInfo);
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
      console.warn('Oturum depolama alanı temizleme istisnası:', e);
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
            title="Beklenmeyen Bir Hata Oluştu"
            subTitle="Arayüz bileşenleri işlenirken beklenmeyen bir sistem uyuşmazlığı saptandı. Oturum verilerinizin bütünlüğünü korumak adına sayfayı yenileyebilir veya çalışma alanınıza dönebilirsiniz."
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
                    Sayfayı Yenile
                  </Button>
                  <Button
                    icon={<HomeOutlined />}
                    onClick={this.handleGoHome}
                    size="large"
                    style={{ borderRadius: 8 }}
                  >
                    Ana Sayfaya Dön
                  </Button>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={this.handleClearAndReset}
                    size="large"
                    danger
                    style={{ borderRadius: 8 }}
                  >
                    Oturumu Sıfırla
                  </Button>
                </Space>

                <div
                  style={{
                    marginTop: 12,
                    textAlign: 'center',
                    color: '#64748B',
                    fontSize: 13,
                    lineHeight: 1.6,
                    maxWidth: 560,
                  }}
                >
                  Sorun devam ederse lütfen tarayıcı önbelleğinizi temizleyiniz veya{' '}
                  <a
                    href="mailto:destek@cenna.live"
                    style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    destek@cenna.live
                  </a>{' '}
                  üzerinden teknik destek birimiyle iletişime geçiniz.
                </div>

                {this.state.error && (
                  <Paragraph
                    style={{
                      maxWidth: 640,
                      textAlign: 'left',
                      marginTop: 20,
                      padding: 14,
                      background: '#F1F5F9',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      color: '#475569',
                      overflowX: 'auto',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase' }}>
                      Sistem Denetim ve Hata Kaydı:
                    </div>
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
