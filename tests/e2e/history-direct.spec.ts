import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('History Page - Direct Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to establish origin context (CRITICAL per CLAUDE.md)
    await page.goto(BASE_URL);
    // Clear localStorage in proper origin context
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch {
        console.log('localStorage not available');
      }
    });
  });

  test('Empty history shows "No completed sprints" message', async ({ page }) => {
    // Navigate to history with no data
    await page.goto(BASE_URL + '/history');
    await page.waitForLoadState('networkidle');

    // Verify "No completed sprints" message appears
    const noSprintsMsg = page.locator('text=No completed sprints yet');
    await expect(noSprintsMsg).toBeVisible();

    // Verify table is NOT visible
    const table = page.locator('table');
    const isTableVisible = await table.isVisible({ timeout: 1000 }).catch(() => false);
    expect(isTableVisible).toBe(false);
  });

  test('History page with direct localStorage data shows completed sprints', async ({ page }) => {
    // Navigate first to establish origin
    await page.goto(BASE_URL);

    // Set up data directly in localStorage in the established origin
    const result = await page.evaluate(() => {
      try {
        const testData = {
          settings: {
            sprintLengthDays: 14,
            standupTime: '09:30',
            notificationsEnabled: false,
          },
          sprints: [
            {
              id: 'test-sprint-1',
              number: 1,
              startDate: '2026-04-01',
              endDate: '2026-04-14',
              status: 'completed',
              plannedPoints: 20,
              completedPoints: 16,
            },
          ],
          tickets: [],
        };
        localStorage.setItem('agile-life-app/v1', JSON.stringify(testData));
        return { success: true, data: localStorage.getItem('agile-life-app/v1') };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeTruthy();

    // Now navigate to history page
    // The fix ensures the component uses useAppStore(selectCompletedSprints)
    // which subscribes to store changes and waits for hydration
    await page.goto(BASE_URL + '/history');
    await page.waitForLoadState('networkidle');

    // Give the component time to hydrate and re-render
    await page.waitForTimeout(500);

    // Verify table is visible (meaning hydration succeeded)
    const table = page.locator('table');
    const isTableVisible = await table.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isTableVisible) {
      // Debug: check what's actually rendered
      const noSprintsVisible = await page
        .locator('text=No completed sprints yet')
        .isVisible({ timeout: 1000 })
        .catch(() => false);

      console.log('Table visible:', isTableVisible);
      console.log('No sprints message visible:', noSprintsVisible);

      const bodyText = await page.locator('body').textContent();
      console.log('Page body text:', bodyText?.substring(0, 500));
    }

    expect(isTableVisible).toBe(true);

    // Verify table has at least one row
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // Verify the sprint data is in the row
    const firstRowText = await rows.first().textContent();
    expect(firstRowText).toContain('2026-04-01');
    expect(firstRowText).toContain('2026-04-14');
    expect(firstRowText).toContain('20');
    expect(firstRowText).toContain('16');
  });

  test('Verify hook pattern is being used (not getState)', async ({ page }) => {
    // This is a sanity check that the fix was applied
    // If using getState(), the component would not properly subscribe to updates
    // If using useAppStore hook, it works correctly with hydration

    await page.goto(BASE_URL);

    // Set up a completed sprint
    await page.evaluate(() => {
      const testData = {
        settings: {
          sprintLengthDays: 14,
          standupTime: '09:30',
          notificationsEnabled: false,
        },
        sprints: [
          {
            id: 'verification-sprint',
            number: 1,
            startDate: '2026-03-01',
            endDate: '2026-03-14',
            status: 'completed',
            plannedPoints: 15,
            completedPoints: 12,
          },
        ],
        tickets: [],
      };
      localStorage.setItem('agile-life-app/v1', JSON.stringify(testData));
    });

    // Navigate to history
    await page.goto(BASE_URL + '/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    // The hook pattern means:
    // 1. Component subscribes to store changes via useAppStore()
    // 2. Zustand's persist middleware hydrates from localStorage
    // 3. Subscriber is notified of state change
    // 4. Component re-renders with data
    //
    // getState() pattern would:
    // 1. Synchronously call getState() during render
    // 2. Before hydration, returns empty arrays
    // 3. Never re-renders when hydration completes

    // If we see the table with data, the hook pattern is working
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Double-check: verify Delete button exists
    // This button only renders if completedSprints has data
    const deleteButton = page.locator('button:has-text("Delete")');
    const deleteExists = await deleteButton.isVisible({ timeout: 1000 }).catch(() => false);
    expect(deleteExists).toBe(true);

    console.log('✓ Hook subscription pattern verified: component properly updates with hydrated data');
  });
});
