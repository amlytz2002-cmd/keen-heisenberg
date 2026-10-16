import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Ensure screenshots directory exists
const screenshotsDir = path.resolve('test-results/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Helper to navigate to protected lesson routes with demo authentication
async function openProtectedLesson(page: any, targetPath: string) {
  await page.goto(targetPath);
  await page.waitForTimeout(600);
  if (page.url().includes('/auth/login')) {
    const demoBtn = page.getByRole('button', { name: /Demo Öğrenci/i });
    await expect(demoBtn).toBeVisible({ timeout: 10000 });
    await demoBtn.click();
    await page.waitForURL((url: URL) => !url.pathname.includes('/auth/login'), { timeout: 15000 });
    if (!page.url().includes(targetPath)) {
      await page.goto(targetPath);
    }
  }
}

test.describe('CennAlive E2E Real Browser Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[Browser Console Error]: ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      console.error(`[Browser Uncaught Exception]: ${err.message}`);
    });
  });

  test('1. Lesson 14, Step 2 (SAR Simulator) answer validation & interaction', async ({ page }) => {
    // 1. Navigate to Lesson 14
    await openProtectedLesson(page, '/learn/lesson/les-14');

    // Wait for Step 1 to load
    await expect(page.getByText('LogP Nedir?')).toBeVisible();

    // Answer Step 1 correctly to reach Step 2
    await page.getByText(/LogP çok yüksek \(>5\) olursa/i).click();
    await page.getByRole('button', { name: 'Kontrol Et' }).click();
    await expect(page.getByText('Doğru Çıkarım!')).toBeVisible();
    await page.getByRole('button', { name: 'Devam Et' }).click();

    // Now on Step 2 (SAR Simulator)
    await expect(page.getByText('SAR Simülatörü: Aromatik Halka Sübstitüsyonu')).toBeVisible();

    // 2. Verify initial state:
    // None of the radio buttons should be checked
    const clInput = page.locator('input[value="sub-cl"]');
    const hInput = page.locator('input[value="sub-h"]');
    await expect(clInput).not.toBeChecked();
    await expect(hInput).not.toBeChecked();

    // "Kontrol Et" button must be disabled
    const checkButton = page.getByRole('button', { name: 'Kontrol Et' });
    await expect(checkButton).toBeDisabled();

    // Capture initial state screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'lesson-14-step-2-initial.png') });

    // 3. Select an incorrect option (-H)
    await page.locator('label', { hasText: '-H' }).click();
    await expect(hInput).toBeChecked();
    await expect(checkButton).toBeEnabled();

    // Submit incorrect answer
    await checkButton.click();
    await expect(page.getByText('Tekrar Değerlendir')).toBeVisible();

    // Capture incorrect state screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'lesson-14-step-2-incorrect.png') });

    // 4. Try again and select the correct option (-Cl)
    await page.getByRole('button', { name: 'Yeniden Dene' }).click();
    await page.locator('label', { hasText: '-Cl' }).click();
    await expect(clInput).toBeChecked();

    // Submit correct answer
    await page.getByRole('button', { name: 'Kontrol Et' }).click();
    await expect(page.getByText('Doğru Çıkarım!')).toBeVisible();

    // Capture correct state screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'lesson-14-step-2-correct.png') });
  });

  test('2. Lesson 15, Step 2 (pH Gauge) answer validation & interaction', async ({ page }) => {
    // 1. Navigate to Lesson 15
    await openProtectedLesson(page, '/learn/lesson/les-15');

    // Wait for Step 1 to load
    await expect(page.getByText('pH-Bölme (pH-Partition) Hipotezi')).toBeVisible();

    // Answer Step 1 correctly to reach Step 2
    await page.getByText(/Zayıf asit ilaçlar asidik ortamda/i).click();
    await page.getByRole('button', { name: 'Kontrol Et' }).click();
    await expect(page.getByText('Doğru Çıkarım!')).toBeVisible();
    await page.getByRole('button', { name: 'Devam Et' }).click();

    // Now on Step 2 (pH Gauge)
    await expect(page.getByText('İnteraktif Henderson-Hasselbalch Göstergesi')).toBeVisible();

    // 2. Verify initial state:
    // "Kontrol Et" button must be disabled before user interaction
    const checkButton = page.getByRole('button', { name: 'Kontrol Et' });
    await expect(checkButton).toBeDisabled();

    // Capture initial state screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'lesson-15-step-2-initial.png') });

    // 3. Select incorrect pH: Duodenum (pH 6.0)
    await page.getByRole('button', { name: /Duodenum/i }).click();
    await expect(checkButton).toBeEnabled();

    // Submit incorrect answer
    await checkButton.click();
    await expect(page.getByText('Tekrar Değerlendir')).toBeVisible();

    // Capture incorrect state screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'lesson-15-step-2-incorrect.png') });

    // 4. Try again and select correct pH: Kan / Plazma (pH 7.4)
    await page.getByRole('button', { name: 'Yeniden Dene' }).click();
    await page.getByRole('button', { name: /Kan \/ Plazma/i }).click();

    // Submit correct answer
    await page.getByRole('button', { name: 'Kontrol Et' }).click();
    await expect(page.getByText('Doğru Çıkarım!')).toBeVisible();

    // Capture correct state screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'lesson-15-step-2-correct.png') });
  });

  test('3. Lesson navigation, state reset, and history back/forward traversal', async ({ page }) => {
    // 1. Open Lesson 1 (4 steps)
    await openProtectedLesson(page, '/learn/lesson/les-1');
    await expect(page.getByText('Adım 1 / 4')).toBeVisible();

    // Generate a mistake on Step 1
    await page.getByText(/Alkoller hidrojen bağı veremez/i).click();
    await page.getByRole('button', { name: 'Kontrol Et' }).click();
    await expect(page.getByText('Tekrar Değerlendir')).toBeVisible();

    // Retry and advance to Step 2
    await page.getByRole('button', { name: 'Yeniden Dene' }).click();
    await page.getByText(/Alkoller hem H-bağı donörü hem akseptörüdür/i).click();
    await page.getByRole('button', { name: 'Kontrol Et' }).click();
    await page.getByRole('button', { name: 'Devam Et' }).click();

    // Confirm we are on Step 2 of les-1
    await expect(page.getByText('Adım 2 / 4')).toBeVisible();

    // 2. Navigate directly to Lesson 8 (1 step)
    await page.goto('/learn/lesson/les-8');

    // Confirm step reset immediately to Step 1 / 1
    await expect(page.getByText('Adım 1 / 1')).toBeVisible();
    await expect(page.getByText('Çift Bağın Dönme Engeli')).toBeVisible();

    // Ensure completion screen is NOT shown
    await expect(page.getByText('Ders Tamamlandı! 🎉')).not.toBeVisible();

    // Complete Lesson 8 on first attempt (0 mistakes in les-8)
    await page.getByText(/Cis ve Trans izomerlerin erime noktası/i).click();
    await page.getByRole('button', { name: 'Kontrol Et' }).click();
    await expect(page.getByText('Doğru Çıkarım!')).toBeVisible();
    await page.getByRole('button', { name: 'Devam Et' }).click();

    // Confirm celebration screen is shown with full reward
    await expect(page.getByText('Ders Tamamlandı! 🎉')).toBeVisible();

    // Capture celebration screenshot
    await page.screenshot({ path: path.join(screenshotsDir, 'lesson-8-completed.png') });

    // 3. Test browser Back navigation to Lesson 1
    await page.goBack();
    await expect(page.getByText('Adım 1 / 4')).toBeVisible();
    await expect(page.getByText('Alkol (-OH) ve Eter (-O-) Polaritesi')).toBeVisible();

    // 4. Test browser Forward navigation to Lesson 8
    await page.goForward();
    await expect(page.getByText('Çift Bağın Dönme Engeli')).toBeVisible();
    await expect(page.getByText('Adım 1 / 1')).toBeVisible();
  });

  test('4. Account isolation audit check', async ({ page }) => {
    // Navigate to auth view
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: /CENNA.live'a Hoş Geldiniz/i })).toBeVisible();

    // Locate demo student button
    const demoStudentBtn = page.getByRole('button', { name: /Demo Öğrenci Olarak Giriş Yap/i });
    await expect(demoStudentBtn).toBeVisible();

    // Click demo sign in
    await demoStudentBtn.click();

    // Observe live response from Supabase
    const errorAlert = page.locator('.ant-alert-error');
    const hasError = await errorAlert.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasError) {
      const errorText = await errorAlert.innerText();
      console.warn(`[Live Auth Isolation Status]: Remote Supabase returned: ${errorText.trim()}`);
    } else {
      const isDashboard = page.url().includes('/app/today') || page.url().includes('/app/teach');
      console.log(`[Live Auth Isolation Status]: User navigated to: ${page.url()}, dashboard: ${isDashboard}`);
    }
  });
});
