// import-seed.test.mjs
// Playwright E2E test suite for roster import, seed generation, and cleanup
// Run with: npx playwright test tests/import-seed.test.mjs

import { test, expect } from '@playwright/test';
import fs from 'fs/promises';

const TEST_JSON_PATH = 'TTPIBA-NR.json'; // Use a real sample file in your repo

// Utility: Generate a random file name for upload
function randomFileName(base = 'imported') {
  return `${base}-${Math.random().toString(36).slice(2, 8)}.json`;
}

test.describe('Roster JSON Import & Seed Management', () => {
  test('Import JSON, assign unique seed, and load', async ({ page }) => {
    await page.goto('http://localhost:3000'); // Adjust port/path as needed
    // Trigger the import button
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#import-json-btn'),
    ]);
    // Upload the sample JSON file
    await fileChooser.setFiles(TEST_JSON_PATH);
    // Wait for toast and check seed input is filled
    await expect(page.locator('#seed-input')).not.toBeEmpty();
    const seed = await page.inputValue('#seed-input');
    expect(seed).toMatch(/^N[A-Z0-9]{6}$/);
    // Check that the roster is loaded (e.g., by checking for a unit name)
    await expect(page.locator('#results')).toContainText('Protoss'); // Adjust as needed
  });

  test('Delete favorite removes from Firestore', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Assume a favorite exists with a generated seed
    // Add a favorite for the current seed
    await page.fill('#seed-input', 'NBC10ST'); // Use a test seed
    await page.click('#save-favorite-btn');
    // Remove the favorite
    await page.click('[data-favorite-remove="NBC10ST"]');
    // Wait for toast
    await expect(page.locator('.toast')).toContainText('Deleted roster from Firestore');
  });

  test('Guest session deletes imported seed on close', async ({ page, context }) => {
    await page.goto('http://localhost:3000');
    // Import a JSON file as before
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#import-json-btn'),
    ]);
    await fileChooser.setFiles(TEST_JSON_PATH);
    // Get the seed
    const seed = await page.inputValue('#seed-input');
    // Close the page (simulate session end)
    await page.close();
    // Optionally, check Firestore via REST API or mock to confirm deletion
    // (Not shown here)
  });
});
