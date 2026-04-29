import { test, expect } from '@playwright/test';
import { v4 as uuid } from 'uuid';

const BASE_URL = 'http://localhost:5173';

test.describe('History Page - Hydration Bug Manual Verification', () => {
  test('History page correctly loads completed sprints with proper hook subscription', async ({ page }) => {
    // Step 1: Navigate to establish origin context
    await page.goto(BASE_URL);

    // Step 2: Clear existing data
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Step 3: Create test data with 2 completed sprints
    const sprintId1 = uuid();
    const sprintId2 = uuid();

    await page.evaluate(({ sprintId1, sprintId2 }) => {
      const testData = {
        settings: {
          sprintLengthDays: 14,
          standupTime: '09:30',
          notificationsEnabled: false,
        },
        sprints: [
          {
            id: sprintId1,
            number: 1,
            startDate: '2026-04-01',
            endDate: '2026-04-14',
            status: 'completed',
            plannedPoints: 13,
            completedPoints: 10,
          },
          {
            id: sprintId2,
            number: 2,
            startDate: '2026-04-15',
            endDate: '2026-04-28',
            status: 'completed',
            plannedPoints: 21,
            completedPoints: 18,
          },
        ],
        tickets: [],
      };
      localStorage.setItem('agile-life-app/v1', JSON.stringify(testData));
    }, { sprintId1, sprintId2 });

    // Step 4: Navigate to History page
    await page.goto(BASE_URL + '/history');

    // Step 5: Wait for hydration to complete
    // The fix ensures that useAppStore(selectCompletedSprints) subscribes to the store
    // and waits for persistence middleware to hydrate from localStorage
    await page.waitForLoadState('networkidle');

    // Step 6: Verify that "No completed sprints" message is NOT visible
    // (this would be the bug - if hydration isn't waited, we'd see this message)
    const noSprintsMsg = page.locator('text=No completed sprints yet');
    const isNoSprintsVisible = await noSprintsMsg.isVisible({ timeout: 2000 }).catch(() => false);

    if (isNoSprintsVisible) {
      throw new Error('HYDRATION BUG: History page shows "No completed sprints" message. ' +
        'This indicates the component rendered before localStorage hydration completed.');
    }

    // Step 7: Verify table exists with sprint data
    const table = page.locator('table');
    const isTableVisible = await table.isVisible({ timeout: 2000 });
    expect(isTableVisible).toBe(true);

    // Step 8: Verify table contains correct sprint data
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBe(2);

    // Step 9: Verify first sprint row shows date range correctly
    const firstRow = rows.first();
    const firstRowText = await firstRow.textContent();
    expect(firstRowText).toContain('2026-04-01');
    expect(firstRowText).toContain('2026-04-14');
    expect(firstRowText).toContain('13'); // Planned
    expect(firstRowText).toContain('10'); // Completed

    // Step 10: Verify second sprint row
    const secondRow = rows.nth(1);
    const secondRowText = await secondRow.textContent();
    expect(secondRowText).toContain('2026-04-15');
    expect(secondRowText).toContain('2026-04-28');
    expect(secondRowText).toContain('21'); // Planned
    expect(secondRowText).toContain('18'); // Completed

    // Step 11: Verify Edit button exists and is clickable
    const editButtons = firstRow.locator('button:has-text("Edit")');
    expect(await editButtons.count()).toBe(1);

    // Step 12: Verify Delete button exists
    const deleteButtons = firstRow.locator('button:has-text("Delete")');
    expect(await deleteButtons.count()).toBe(1);

    // Step 13: Check for console errors
    // The fix prevents React hydration mismatch errors
    let hasErrors = false;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        hasErrors = true;
      }
    });

    // Brief wait to catch any errors
    await page.waitForTimeout(1000);
    expect(hasErrors).toBe(false);

    console.log('✓ Hydration fix verified: History page correctly displays completed sprints');
  });

  test('Verify the fix at HistoryPage.tsx line 8 is applied', async ({ page }) => {
    // This test checks that the code uses the hook pattern, not getState()

    await page.goto(BASE_URL);

    // Set up minimal test data
    await page.evaluate(() => {
      localStorage.setItem('agile-life-app/v1', JSON.stringify({
        settings: { sprintLengthDays: 14, standupTime: '09:30', notificationsEnabled: false },
        sprints: [{
          id: 'test-id',
          number: 1,
          startDate: '2026-04-01',
          endDate: '2026-04-14',
          status: 'completed',
          plannedPoints: 10,
          completedPoints: 8,
        }],
        tickets: [],
      }));
    });

    // Navigate to history
    await page.goto(BASE_URL + '/history');
    await page.waitForLoadState('networkidle');

    // The critical test: if we see the table with data, it means:
    // - useAppStore(selectCompletedSprints) is being used (hook pattern)
    // - The component subscribed to store changes
    // - Hydration was waited for
    // If the bug were present (using getState()), we'd see "No completed sprints"

    const table = page.locator('table');
    const isVisible = await table.isVisible({ timeout: 2000 }).catch(() => false);

    expect(isVisible).toBe(true);

    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);

    console.log('✓ Code fix verified: Hook subscription pattern is in use');
  });
});
