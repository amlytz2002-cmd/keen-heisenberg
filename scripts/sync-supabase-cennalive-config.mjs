/**
 * sync-supabase-cennalive-config.mjs
 * 
 * Synchronizes production Auth Configuration & Custom Resend SMTP for Supabase project `ltmtmhmadsrlvuqffdcs`:
 * - Site URL: https://cenna.live
 * - Additional Redirect URLs: https://cenna.live/**, https://pharmiq-app.pages.dev/**, http://localhost:5173/**
 * - Custom SMTP (Resend):
 *     Host: smtp.resend.com
 *     Port: 587 (TLS) or 465 (SSL)
 *     User: resend
 *     Pass: re_aN1ARQdM_FyAfTzxYVe7DNjq3KmRujVqb
 *     Admin Email: bildirim@cenna.live
 *     Sender Name: CENNA.live
 * - Academic Turkish email templates for confirmation, recovery, invite, magiclink, and email_change.
 */

import fs from 'fs';
import path from 'path';

const PROJECT_REF = 'ltmtmhmadsrlvuqffdcs';
const SITE_URL = 'https://cenna.live';
const REDIRECT_URLS = [
  'https://cenna.live/**',
  'https://pharmiq-app.pages.dev/**',
  'http://localhost:5173/**',
  'http://localhost:3000/**'
];

const RESEND_SMTP = {
  host: 'smtp.resend.com',
  port: 587,
  user: 'resend',
  pass: 're_aN1ARQdM_FyAfTzxYVe7DNjq3KmRujVqb',
  admin_email: 'bildirim@cenna.live',
  sender_name: 'CENNA.live'
};

async function main() {
  console.log('=====================================================');
  console.log('CENNA.live — Supabase Auth & Resend SMTP Synchronization');
  console.log('=====================================================');
  console.log(`Target Project:     ${PROJECT_REF}`);
  console.log(`Site URL:           ${SITE_URL}`);
  console.log(`Redirect URLs:      ${REDIRECT_URLS.join(', ')}`);
  console.log(`SMTP Provider:      Resend (${RESEND_SMTP.host}:${RESEND_SMTP.port})`);
  console.log(`Sender Identity:    ${RESEND_SMTP.sender_name} <${RESEND_SMTP.admin_email}>`);
  console.log('-----------------------------------------------------');

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.log('\n[INFO] SUPABASE_ACCESS_TOKEN is not currently exported in this session.');
    console.log('You can synchronize automated settings by running:');
    console.log(`  $env:SUPABASE_ACCESS_TOKEN="<your_personal_access_token>"`);
    console.log('  node scripts/sync-supabase-cennalive-config.mjs');
    console.log('\nOr configure directly in the Supabase Dashboard:');
    console.log(`  1. SMTP Settings:     https://supabase.com/dashboard/project/${PROJECT_REF}/settings/auth`);
    console.log(`     - Enable Custom SMTP: ON`);
    console.log(`     - Sender email:       ${RESEND_SMTP.admin_email}`);
    console.log(`     - Sender name:        ${RESEND_SMTP.sender_name}`);
    console.log(`     - Host:               ${RESEND_SMTP.host}`);
    console.log(`     - Port:               ${RESEND_SMTP.port}`);
    console.log(`     - Username:           ${RESEND_SMTP.user}`);
    console.log(`     - Password:           ${RESEND_SMTP.pass}`);
    console.log(`  2. URL Configuration: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration`);
    console.log(`     - Site URL:           ${SITE_URL}`);
    console.log(`     - Redirect URLs:      ${REDIRECT_URLS.join(', ')}`);
    console.log(`  3. Email Templates:   https://supabase.com/dashboard/project/${PROJECT_REF}/auth/templates`);
    console.log('     - Templates located in ./supabase/templates/ (confirmation, recovery, invite, magic_link, email_change)');
    console.log('=====================================================\n');
    return;
  }

  const loadTemplate = (filename) => {
    const p = path.resolve('supabase/templates', filename);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : undefined;
  };

  const confirmationTemplate = loadTemplate('confirmation.html');
  const recoveryTemplate = loadTemplate('recovery.html');
  const inviteTemplate = loadTemplate('invite.html');
  const magicLinkTemplate = loadTemplate('magic_link.html');
  const emailChangeTemplate = loadTemplate('email_change.html');

  const endpoint = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
  console.log(`[SENDING PATCH REQUEST] ${endpoint}...`);

  const payload = {
    site_url: SITE_URL,
    uri_allow_list: REDIRECT_URLS.join(','),
    smtp_admin_email: RESEND_SMTP.admin_email,
    smtp_host: RESEND_SMTP.host,
    smtp_port: RESEND_SMTP.port,
    smtp_user: RESEND_SMTP.user,
    smtp_pass: RESEND_SMTP.pass,
    smtp_sender_name: RESEND_SMTP.sender_name,
    smtp_max_frequency: 60,
    mailer_autoconfirm: false,
    mailer_recovery_template: recoveryTemplate,
    mailer_confirmation_template: confirmationTemplate,
    mailer_invite_template: inviteTemplate,
    mailer_magic_link_template: magicLinkTemplate,
    mailer_email_change_template: emailChangeTemplate,
  };

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (response.ok) {
    console.log('[SUCCESS] Supabase Auth & Resend SMTP successfully configured:', data);
  } else {
    console.error('[ERROR] Failed to update Supabase Auth config:', data);
  }
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
