import React from 'react';
import { useRouter } from '../context/RouterContext';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer
      style={{
        backgroundColor: '#0F172A',
        color: '#94A3B8',
        padding: '48px 16px 32px',
        borderTop: '1px solid #1E293B',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 32,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              C
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>CENNA.live</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 300, color: '#94A3B8' }}>
            AI-powered active retrieval and deliberate practice platform. Continuous cycle: Learn, Retrieve, Apply, Remediate, Review.
          </p>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 16 }}>
            © {new Date().getFullYear()} CENNA.live. All rights reserved.
          </div>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Platform & Pedagogy
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <li>
              <button
                onClick={() => navigate('/how-it-works')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                The 5-Stage Learning Cycle
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                Source-Grounded AI & Provenance
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                Socratic Hint Ladders
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/features')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                1-3-7-14 Day Spaced Repetition
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Security & Governance
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
            <li>
              <button
                onClick={() => navigate('/privacy')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                Privacy Policy & RLS Isolation
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/terms')}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                Terms of Service
              </button>
            </li>
            <li>
              <span style={{ color: '#64748B' }}>Instructor Publication Gate (Enforced)</span>
            </li>
            <li>
              <span style={{ color: '#64748B' }}>Server-Side Secrets Protection</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
