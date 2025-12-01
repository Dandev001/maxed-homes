import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Look for login link or button
    const loginLink = page.locator('a[href*="/login"]').or(page.locator('button:has-text("Login")'));
    
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await expect(page).toHaveURL(/.*login/);
    } else {
      // If no login link, try direct navigation
      await page.goto('/login');
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email and password fields
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[name*="email"]'));
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    const registerLink = page.locator('a[href*="/register"]').or(page.locator('button:has-text("Register")'));
    
    if (await registerLink.count() > 0) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register/);
    } else {
      await page.goto('/register');
      await expect(page).toHaveURL(/.*register/);
    }
  });

  test('should show register form', async ({ page }) => {
    await page.goto('/register');
    
    // Check for registration fields
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[name*="email"]'));
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
  });
});

