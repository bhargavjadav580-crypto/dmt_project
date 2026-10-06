import { test, expect } from '@playwright/test';

test.describe('Hospital Patient Flow Management - End-to-End Suite', () => {

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('Public Waiting Room Display renders anonymously without PHI', async ({ page }) => {
    await page.goto('/display/GENERAL_OPD');
    
    // Heading should be visible
    await expect(page.locator('h1')).toContainText(/general opd/i);
    await expect(page.getByText('NOW SERVING')).toBeVisible();
    await expect(page.getByText('Next In Line')).toBeVisible();
  });

  test('Login Screen displays 1-click role demo logins', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText('Sign in to your station')).toBeVisible();
    await expect(page.getByText('1-Click Demo Logins')).toBeVisible();
    await expect(page.getByRole('button', { name: 'RECEPTIONIST' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'DOCTOR' })).toBeVisible();
  });

  test('Scenario 1: Receptionist logs in and navigates dashboard & registration', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'RECEPTIONIST' }).click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByText('What needs attention?')).toBeVisible();

    // Navigate to Register Patient
    await page.goto('/patients/new');
    await expect(page.getByRole('heading', { name: 'Register Patient' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New Patient' })).toBeVisible();
  });

  test('Scenario 2: Nurse Station loads triage queue', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'NURSE' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/nurse');
    await expect(page.getByRole('heading', { name: /nurse triage station/i })).toBeVisible();
  });

  test('Scenario 3: Doctor Consultation and Clinical Workstation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'DOCTOR' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/consultation');
    await expect(page.getByRole('heading', { name: /clinical workspace/i })).toBeVisible();
  });

  test('Scenario 4: Laboratory Workstation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'LAB_TECH' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/lab');
    await expect(page.getByRole('heading', { name: /laboratory/i })).toBeVisible();
  });

  test('Scenario 5: Pharmacy Workstation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'PHARMACIST' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/pharmacy');
    await expect(page.getByRole('heading', { name: /pharmacy/i })).toBeVisible();
  });

  test('Scenario 6: Admissions Bed Board', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'ADMISSION_STAFF' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/admissions');
    await expect(page.getByRole('heading', { name: /admissions/i })).toBeVisible();
  });

  test('Scenario 7: Billing & Cashier Desk', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'BILLING_STAFF' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/billing');
    await expect(page.getByRole('heading', { name: /billing/i })).toBeVisible();
  });

  test('Scenario 8: Admin Command Center', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'ADMIN' }).click();
    await page.waitForURL('**/dashboard');

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /command center/i })).toBeVisible();
  });
});
