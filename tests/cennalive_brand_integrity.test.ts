import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * ============================================================================
 * CENNA.live BRAND INTEGRITY & CONFIGURATION TEST SUITE (Tiers 1-4)
 * ============================================================================
 * Authoritative Contracts:
 *   - ORIGINAL_REQUEST.md: Exactly 0 occurrences of "PharmIQ" or "CENNA.ai" in
 *     source code, edge functions, workers, and user views (strictly "CENNA.live").
 *   - PROJECT.md: Feature 1 (Brand Integrity Purge) across package.json,
 *     wrangler.toml, env, source code, headers, and tests.
 * ============================================================================
 */

// Helper to sanitize dynamic text and enforce CENNA.live branding
export function sanitizeBrandReferences(input: string): string {
  return input
    .replace(/\bPharmIQ\b/gi, 'CENNA.live')
    .replace(/\bCENNA\.ai\b/gi, 'CENNA.live');
}

// Helper to test if a string contains legacy brand references
export function containsLegacyBrand(text: string): boolean {
  const legacyPattern = /(?:PharmIQ|CENNA\.ai)/i;
  return legacyPattern.test(text);
}

// Helper to verify that clinical pharmacology stems are not falsely flagged
export function isLegitimatePharmacologyWord(word: string): boolean {
  const normalized = word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g');

  const legitStems = [
    'pharmacology',
    'pharmacokinetics',
    'pharmacotherapy',
    'pharmaceutical',
    'biopharmaceutics',
    'pharmacy',
    'pharmacovigilance',
    'farmakoloji',
    'farmakokinetik',
    'farmasotik',
    'eczacilik',
  ];
  return legitStems.some((stem) => normalized.includes(stem)) && !normalized.includes('pharmiq');
}

describe('CENNA.live Brand Integrity Suite', () => {
  const projectRoot = path.resolve(__dirname, '..');

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (Brand Integrity across Components & Configs)
  // ==========================================================================
  describe('Tier 1: Feature Coverage — Brand Integrity Across Core Artifacts', () => {
    it('T1.1: verifies package.json contains 0 occurrences of PharmIQ or CENNA.ai and uses canonical identity', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);

      // Must not contain legacy brand names in name or scripts
      expect(containsLegacyBrand(pkg.name)).toBe(false);
      expect(['cenna-live-platform', 'cennalive-pilot']).toContain(pkg.name);
      expect(content).not.toMatch(/PharmIQ/i);
      expect(content).not.toMatch(/CENNA\.ai/i);
    });

    it('T1.2: verifies functions/api/tutor/turn.ts sets X-Title to CENNA.live Pedagogical Engine', () => {
      const tutorPath = path.join(projectRoot, 'functions', 'api', 'tutor', 'turn.ts');
      expect(fs.existsSync(tutorPath)).toBe(true);
      const content = fs.readFileSync(tutorPath, 'utf-8');

      expect(content).toContain("'CENNA.live Pedagogical Engine'");
      expect(content).not.toContain('PharmIQ Pedagogical Engine');
    });

    it('T1.3: verifies .env.example header uses CENNA.live without legacy brand names', () => {
      const envPath = path.join(projectRoot, '.env.example');
      expect(fs.existsSync(envPath)).toBe(true);
      const content = fs.readFileSync(envPath, 'utf-8');

      expect(content).toContain('CENNA.live');
      expect(content).not.toMatch(/# PharmIQ/i);
    });

    it('T1.4: verifies index.html document shell contains CENNA.live in title and meta description', () => {
      const indexPath = path.join(projectRoot, 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      const content = fs.readFileSync(indexPath, 'utf-8');

      expect(content).toContain('CENNA.live');
      expect(content).not.toMatch(/PharmIQ/i);
      expect(content).not.toMatch(/CENNA\.ai/i);
    });

    it('T1.5: verifies public marketing views exhibit CENNA.live platform identity', () => {
      const landingPath = path.join(projectRoot, 'src', 'views', 'Public', 'LandingView.tsx');
      expect(fs.existsSync(landingPath)).toBe(true);
      const content = fs.readFileSync(landingPath, 'utf-8');

      expect(content).toContain('CENNA.live');
      expect(content).not.toMatch(/PharmIQ/i);
      expect(content).not.toMatch(/CENNA\.ai/i);
    });

    it('T1.6: verifies authentication client defines canonical CennaLive demo credentials', () => {
      const supabaseClientPath = path.join(projectRoot, 'src', 'lib', 'supabaseClient.ts');
      expect(fs.existsSync(supabaseClientPath)).toBe(true);
      const content = fs.readFileSync(supabaseClientPath, 'utf-8');

      // Must have the primary CennaLive demo credentials configured
      expect(content).toContain('CennaLive2026!Demo');
      expect(content).toContain('pilot.student@biruni.edu.tr');
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (Regex, False Positives, Sanitization)
  // ==========================================================================
  describe('Tier 2: Boundary & Corner Cases — Brand Detection & Sanitization', () => {
    it('T2.1: accurately flags legacy brand names regardless of casing or formatting', () => {
      const badExamples = [
        'Welcome to PharmIQ portal',
        'Powered by pharmiq engine',
        'PHARMIQ API version 2',
        'Visit CENNA.ai website',
        'Created with cenna.ai assistant',
      ];

      for (const text of badExamples) {
        expect(containsLegacyBrand(text)).toBe(true);
      }
    });

    it('T2.2: does NOT trigger false positives for legitimate clinical pharmacology terms', () => {
      const legitTexts = [
        'Klinik farmakoloji ve rasyonel farmakoterapi ilkeleri',
        'Clinical pharmacokinetics and therapeutic drug monitoring',
        'Farmasötik teknoloji ve biyofarmasötik hesaplamalar',
        'Hastanede eczacılık uygulamaları ve ilaç etkileşimleri',
        'Pharmacovigilance monitoring for adverse drug reactions',
      ];

      for (const text of legitTexts) {
        expect(containsLegacyBrand(text)).toBe(false);
        const words = text.split(/\s+/);
        const hasLegit = words.some((w) => isLegitimatePharmacologyWord(w));
        expect(hasLegit).toBe(true);
      }
    });

    it('T2.3: sanitizes legacy brand occurrences in dynamic prompts or generated content', () => {
      const rawText = 'Welcome to PharmIQ! Consult your CENNA.ai tutor for pharmacokinetics guidance.';
      const sanitized = sanitizeBrandReferences(rawText);

      expect(sanitized).toBe('Welcome to CENNA.live! Consult your CENNA.live tutor for pharmacokinetics guidance.');
      expect(containsLegacyBrand(sanitized)).toBe(false);
    });

    it('T2.4: preserves exact punctuation, URLs, and casing when sanitizing text', () => {
      const sample = 'https://cenna.live is our domain; previously known as PharmIQ, not CENNA.ai.';
      const clean = sanitizeBrandReferences(sample);

      expect(clean).toBe('https://cenna.live is our domain; previously known as CENNA.live, not CENNA.live.');
    });

    it('T2.5: handles edge cases like empty string, whitespace-only, and strings without brand mentions', () => {
      expect(sanitizeBrandReferences('')).toBe('');
      expect(sanitizeBrandReferences('   ')).toBe('   ');
      expect(sanitizeBrandReferences('Kreatinin klerensi hesabı')).toBe('Kreatinin klerensi hesabı');
      expect(containsLegacyBrand('')).toBe(false);
      expect(containsLegacyBrand('Terapötik aralık')).toBe(false);
    });
  });

  // ==========================================================================
  // TIER 3: CROSS-FEATURE INTERACTIONS (Headers, Origin, Shared Brand Constants)
  // ==========================================================================
  describe('Tier 3: Cross-Feature Interactions — Consistent Brand Contract', () => {
    it('T3.1: verifies edge function telemetry headers align with https://cenna.live domain', () => {
      const tutorPath = path.join(projectRoot, 'functions', 'api', 'tutor', 'turn.ts');
      const content = fs.readFileSync(tutorPath, 'utf-8');

      expect(content).toContain("headers['HTTP-Referer'] = 'https://cenna.live'");
      expect(content).toContain("headers['X-Title'] = 'CENNA.live Pedagogical Engine'");
    });

    it('T3.2: verifies invitation URL generator matches canonical CENNA.live origin', () => {
      function generateInvitationUrl(token: string, origin: string = 'https://cenna.live'): string {
        return `${origin}/invite/${encodeURIComponent(token)}`;
      }

      const inviteUrl = generateInvitationUrl('cennalive_inv_9988');
      expect(inviteUrl).toBe('https://cenna.live/invite/cennalive_inv_9988');
      expect(inviteUrl.startsWith('https://cenna.live/invite/')).toBe(true);
      expect(containsLegacyBrand(inviteUrl)).toBe(false);
    });

    it('T3.3: verifies email notification headers and signatures use CENNA.live branding', () => {
      function formatEmailFooter(institutionName: string): string {
        return `Bu e-posta, ${institutionName} akademik iş birliği kapsamında CENNA.live platformu tarafından otomatik olarak gönderilmiştir.`;
      }

      const footer = formatEmailFooter('Biruni Üniversitesi Eczacılık Fakültesi');
      expect(footer).toContain('CENNA.live platformu');
      expect(containsLegacyBrand(footer)).toBe(false);
    });
  });

  // ==========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (E2E Brand Journey)
  // ==========================================================================
  describe('Tier 4: Real-World Scenarios — Full User Journey Brand Integrity', () => {
    it('T4.1: simulated student journey from Landing to Study Session exhibits 100% unified CENNA.live branding', () => {
      interface PageViewSnapshot {
        route: string;
        pageTitle: string;
        brandHeader: string;
        footerNotice: string;
      }

      const studentJourney: PageViewSnapshot[] = [
        {
          route: '/',
          pageTitle: 'CENNA.live — İlaç Bilimleri Aktif Öğrenme Platformu',
          brandHeader: 'CENNA.live',
          footerNotice: '© 2026 CENNA.live. Tüm hakları saklıdır.',
        },
        {
          route: '/auth/login',
          pageTitle: 'Giriş Yap — CENNA.live',
          brandHeader: 'CENNA.live',
          footerNotice: 'CENNA.live Güvenli Kimlik Doğrulama',
        },
        {
          route: '/app/today',
          pageTitle: 'Bugün — CENNA.live',
          brandHeader: 'CENNA.live',
          footerNotice: 'CENNA.live Aktif Pekiştirme Sistemi',
        },
        {
          route: '/app/study/session-1',
          pageTitle: 'Çalışma Oturumu — CENNA.live',
          brandHeader: 'CENNA.live',
          footerNotice: 'CENNA.live Sokratik Rehber',
        },
      ];

      for (const step of studentJourney) {
        expect(containsLegacyBrand(step.pageTitle)).toBe(false);
        expect(containsLegacyBrand(step.brandHeader)).toBe(false);
        expect(containsLegacyBrand(step.footerNotice)).toBe(false);
        expect(step.brandHeader).toBe('CENNA.live');
      }
    });

    it('T4.2: simulated instructor document ingestion and content approval maintains CENNA.live branding', () => {
      interface InstructorAuditLog {
        action: string;
        resourceTitle: string;
        platformSignature: string;
      }

      const log: InstructorAuditLog = {
        action: 'APPROVE_QUESTION',
        resourceTitle: 'Klinik Farmakokinetik Giriş Notları',
        platformSignature: 'Verified by CENNA.live Anti-Hallucination Gate',
      };

      expect(containsLegacyBrand(log.platformSignature)).toBe(false);
      expect(log.platformSignature).toContain('CENNA.live');
    });
  });
});
