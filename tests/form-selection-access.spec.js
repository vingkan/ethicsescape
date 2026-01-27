import { test, expect } from '@playwright/test';
import {
  configurePlayer,
  checkFormSelectionAccess,
} from './helpers/game-helpers.js';

// Server URLs - Playwright manages these via webServer config
const SERVER_URLS = {
  4000: 'http://localhost:4000',
  4001: 'http://localhost:4001',
  4002: 'http://localhost:4002',
  4003: 'http://localhost:4003',
};

function getServerUrl(port) {
  return SERVER_URLS[port];
}

test.describe('Form Selection Access Control', () => {
  test('first player (Heart) can access form selection', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const baseUrl = getServerUrl(4000);

    // Configure player 1 as Heart (index 0) with 2-player team
    await configurePlayer(page, baseUrl, 2, 0);

    // Verify submit button is visible
    const submitButton = page.locator('#submit-form-btn');
    await expect(submitButton).toBeVisible();

    // Click submit button to access form selection
    await submitButton.click();

    // Wait for form selection view to appear
    await page.waitForSelector('#form-selection-view', { state: 'visible' });

    // Verify form selection screen is displayed
    const formSelectionView = page.locator('#form-selection-view');
    await expect(formSelectionView).toBeVisible();

    // Verify no "Access Restricted" message
    const restrictedMessage = formSelectionView.locator('text=Access Restricted');
    await expect(restrictedMessage).not.toBeVisible();

    // Verify form selection header is present
    const header = formSelectionView.locator('text=Team Authorization Form Selection');
    await expect(header).toBeVisible();

    await context.close();
  });

  test('non-first players cannot access form selection', async ({ browser }) => {
    const baseUrl1 = getServerUrl(4000);
    const baseUrl2 = getServerUrl(4001);

    // Configure player 1 (Heart, index 0)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await configurePlayer(page1, baseUrl1, 2, 0);

    // Configure player 2 (Spade, index 1)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await configurePlayer(page2, baseUrl2, 2, 1);

    // Player 2 should NOT see the submit button
    const submitButton2 = page2.locator('#submit-form-btn');
    await expect(submitButton2).not.toBeVisible();

    // Try to access form selection programmatically (simulating direct navigation)
    // First, let's try clicking a button that might trigger it
    // Since the button isn't visible, we'll check by trying to navigate to the form selection view
    // by evaluating the showFormSelection function directly
    const formSelectionAccess = await page2.evaluate(() => {
      // Check current player index
      const currentPlayerIndex = parseInt(localStorage.getItem('currentPlayerIndex') || '0');
      return currentPlayerIndex === 0;
    });

    expect(formSelectionAccess).toBe(false);

    // Try to trigger form selection via JavaScript
    await page2.evaluate(() => {
      if (typeof showFormSelection === 'function') {
        showFormSelection();
      }
    });

    // Wait a bit for any UI updates
    await page2.waitForTimeout(1000);

    // Check if form selection view appeared
    const formSelectionView = page2.locator('#form-selection-view');
    const isVisible = await formSelectionView.isVisible().catch(() => false);

    if (isVisible) {
      // If it appeared, it should show access restricted message
      const restrictedMessage = formSelectionView.locator('text=Access Restricted');
      await expect(restrictedMessage).toBeVisible();

      // Verify the message content
      const messageText = await restrictedMessage.textContent();
      expect(messageText).toContain('Only the team captain (Heart) can submit the authorization form');
    }

    await context1.close();
    await context2.close();
  });

  test('form selection button visibility for different players', async ({ browser }) => {
    const baseUrl1 = getServerUrl(4000);
    const baseUrl2 = getServerUrl(4001);

    // Configure player 1 (Heart, index 0)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await configurePlayer(page1, baseUrl1, 2, 0);

    // Configure player 2 (Spade, index 1)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await configurePlayer(page2, baseUrl2, 2, 1);

    // Player 1 should see the submit button
    const submitButton1 = page1.locator('#submit-form-btn');
    await expect(submitButton1).toBeVisible();
    const buttonText1 = await submitButton1.textContent();
    expect(buttonText1).toContain('Submit Authorization Form');

    // Player 2 should NOT see the submit button
    const submitButton2 = page2.locator('#submit-form-btn');
    await expect(submitButton2).not.toBeVisible();

    await context1.close();
    await context2.close();
  });

  test('form selection shows access restricted message for non-first player', async ({ browser }) => {
    const baseUrl2 = getServerUrl(4001);

    // Configure player 2 (Spade, index 1) directly
    const context = await browser.newContext();
    const page = await context.newPage();
    await configurePlayer(page, baseUrl2, 2, 1);

    // Manually set up form selection view to test access control
    // We'll trigger the form selection function and check the result
    await page.evaluate(() => {
      // Simulate accessing form selection
      if (typeof UI !== 'undefined' && typeof UI.showFormSelection === 'function') {
        const forms = [
          { id: 'form-a', name: 'Form A: Enhanced Interrogation', preview: 'Authorizes enhanced interrogation techniques.' },
          { id: 'form-b', name: 'Form B: Psychologist Discussion', preview: 'Authorizes psychologist discussion.' }
        ];
        UI.showFormSelection(forms);
      }
    });

    // Wait for form selection view
    await page.waitForTimeout(1000);

    // Check if form selection view is visible
    const formSelectionView = page.locator('#form-selection-view');
    const isVisible = await formSelectionView.isVisible().catch(() => false);

    if (isVisible) {
      // Should show access restricted message
      const restrictedMessage = formSelectionView.locator('text=Access Restricted');
      await expect(restrictedMessage).toBeVisible();

      // Verify message content
      const messageText = await formSelectionView.locator('text=Only the team captain').textContent();
      expect(messageText).toContain('Only the team captain (Heart) can submit the authorization form');
    } else {
      // If form selection view is not visible, that's also acceptable
      // The access control might prevent it from showing at all
      const submitButton = page.locator('#submit-form-btn');
      await expect(submitButton).not.toBeVisible();
    }

    await context.close();
  });
});
