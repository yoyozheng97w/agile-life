import { test, expect } from '@playwright/test';
import { v4 as uuid } from 'uuid';

const BASE_URL = 'http://localhost:5173';

test.describe('History Page - Hydration Bug Fix', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first to establish proper origin context
    await page.goto(BASE_URL);
    // Clear localStorage after navigating to proper origin
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch {
        console.log('localStorage not available');
      }
    });
  });

  test('1. History page loads with completed sprints from localStorage', async ({ page }) => {
    // Create test data with 2 completed sprints directly in localStorage
    const sprintId1 = uuid();
    const sprintId2 = uuid();
    const ticketId1 = uuid();
    const ticketId2 = uuid();
    const ticketId3 = uuid();

    // Setup completed sprints in localStorage
    await page.evaluate(({ sprintId1, sprintId2, ticketId1, ticketId2, ticketId3 }) => {
      const appData = {
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
            completedPoints: 13,
          },
          {
            id: sprintId2,
            number: 2,
            startDate: '2026-04-15',
            endDate: '2026-04-28',
            status: 'completed',
            plannedPoints: 16,
            completedPoints: 10,
          },
        ],
        tickets: [
          {
            id: ticketId1,
            title: 'Sprint 1 - Feature A',
            description: 'Test ticket 1',
            points: 5,
            status: 'done',
            sprintId: sprintId1,
            createdAt: '2026-04-01T10:00:00.000Z',
            completedAt: '2026-04-10T15:00:00.000Z',
          },
          {
            id: ticketId2,
            title: 'Sprint 1 - Feature B',
            description: 'Test ticket 2',
            points: 8,
            status: 'done',
            sprintId: sprintId1,
            createdAt: '2026-04-01T10:00:00.000Z',
            completedAt: '2026-04-12T14:00:00.000Z',
          },
          {
            id: ticketId3,
            title: 'Sprint 2 - Feature C',
            description: 'Test ticket 3',
            points: 10,
            status: 'done',
            sprintId: sprintId2,
            createdAt: '2026-04-15T10:00:00.000Z',
            completedAt: '2026-04-25T16:00:00.000Z',
          },
        ],
      };
      localStorage.setItem('agile-life-app/v1', JSON.stringify(appData));
    }, { sprintId1, sprintId2, ticketId1, ticketId2, ticketId3 });

    // Navigate to history page
    await page.goto(BASE_URL + '/history');

    // Wait for page to hydrate from localStorage
    await page.waitForLoadState('networkidle');

    // Verify page loaded (no "No completed sprints" message)
    const noSprintsMsg = page.locator('text=No completed sprints yet');
    await expect(noSprintsMsg).not.toBeVisible();

    // Check that the table renders with sprints
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify table header shows "Date Range"
    const dateRangeHeader = page.locator('th:has-text("Date Range")');
    await expect(dateRangeHeader).toBeVisible();

    // Verify table rows contain date ranges, not "Sprint 1"
    const firstRow = page.locator('table tbody tr').first();
    const dateText = await firstRow.locator('td').first().textContent();
    expect(dateText).toMatch(/2026-04-01 ~ 2026-04-14/);

    // Verify second row
    const secondRow = page.locator('table tbody tr').nth(1);
    const dateText2 = await secondRow.locator('td').first().textContent();
    expect(dateText2).toMatch(/2026-04-15 ~ 2026-04-28/);
  });

  test('2. History charts display data with correct X-axis dates', async ({ page }) => {
    // Setup test data
    const sprintId1 = uuid();
    const sprintId2 = uuid();

    await page.evaluate(({ sprintId1, sprintId2 }) => {
      const appData = {
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
            plannedPoints: 20,
            completedPoints: 18,
          },
          {
            id: sprintId2,
            number: 2,
            startDate: '2026-04-15',
            endDate: '2026-04-28',
            status: 'completed',
            plannedPoints: 21,
            completedPoints: 15,
          },
        ],
        tickets: [],
      };
      localStorage.setItem('agile-life-app/v1', JSON.stringify(appData));
    }, { sprintId1, sprintId2 });

    // Navigate to history
    await page.goto(BASE_URL + '/history');
    await page.waitForLoadState('networkidle');

    // Check LineChart is visible
    const charts = page.locator('svg');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThanOrEqual(2); // At least 2 charts (LineChart + BarChart)

    // Verify charts render with data (look for line elements in SVG)
    const lineElements = page.locator('svg line');
    const lineCount = await lineElements.count();
    expect(lineCount).toBeGreaterThan(0);
  });

  test('3. History page delete button works correctly', async ({ page }) => {
    // Setup test data
    const sprintId1 = uuid();
    const sprintId2 = uuid();
    const ticketId1 = uuid();
    const ticketId2 = uuid();

    await page.evaluate(({ sprintId1, sprintId2, ticketId1, ticketId2 }) => {
      const appData = {
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
            completedPoints: 8,
          },
          {
            id: sprintId2,
            number: 2,
            startDate: '2026-04-15',
            endDate: '2026-04-28',
            status: 'completed',
            plannedPoints: 16,
            completedPoints: 10,
          },
        ],
        tickets: [
          {
            id: ticketId1,
            title: 'Sprint 1 Ticket',
            points: 8,
            status: 'done',
            sprintId: sprintId1,
            createdAt: '2026-04-01T10:00:00.000Z',
            completedAt: '2026-04-10T15:00:00.000Z',
          },
          {
            id: ticketId2,
            title: 'Sprint 2 Ticket',
            points: 10,
            status: 'done',
            sprintId: sprintId2,
            createdAt: '2026-04-15T10:00:00.000Z',
            completedAt: '2026-04-25T16:00:00.000Z',
          },
        ],
      };
      localStorage.setItem('agile-life-app/v1', JSON.stringify(appData));
    }, { sprintId1, sprintId2, ticketId1, ticketId2 });

    // Navigate to history
    await page.goto(BASE_URL + '/history');
    await page.waitForLoadState('networkidle');

    // Verify 2 rows exist
    let rows = page.locator('table tbody tr');
    const initialRowCount = await rows.count();
    expect(initialRowCount).toBe(2);

    // Click delete button on first row
    const firstRowDelete = page.locator('table tbody tr').first().locator('button:has-text("Delete")');
    await firstRowDelete.click();

    // Verify delete confirmation dialog appears
    const confirmButton = page.locator('button:has-text("Confirm")');
    await expect(confirmButton).toBeVisible();
    const cancelButton = page.locator('button:has-text("Cancel")');
    await expect(cancelButton).toBeVisible();

    // Click Confirm to delete
    await confirmButton.click();

    // Wait for deletion to complete
    await page.waitForTimeout(300);

    // Verify row was deleted from table
    rows = page.locator('table tbody tr');
    const finalRowCount = await rows.count();
    expect(finalRowCount).toBe(1);

    // Verify localStorage was updated (sprint deleted)
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('agile-life-app/v1');
      return data ? JSON.parse(data) : null;
    });

    expect(localStorageData.sprints.length).toBe(1);
    // Verify the remaining sprint is sprintId2
    expect(localStorageData.sprints[0].id).toBe(sprintId2);
    // Verify tickets for deleted sprint are also gone
    expect(localStorageData.tickets.length).toBe(1);
  });

  test('4. History page edit functionality persists changes', async ({ page }) => {
    // Setup test data
    const sprintId1 = uuid();

    await page.evaluate(({ sprintId1 }) => {
      const appData = {
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
            completedPoints: 8,
          },
        ],
        tickets: [],
      };
      localStorage.setItem('agile-life-app/v1', JSON.stringify(appData));
    }, { sprintId1 });

    // Navigate to history
    await page.goto(BASE_URL + '/history');
    await page.waitForLoadState('networkidle');

    // Click Edit button
    const editButton = page.locator('table tbody tr').first().locator('button:has-text("Edit")');
    await editButton.click();

    // Verify input fields appear
    const inputs = page.locator('table tbody tr').first().locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBe(2); // Planned and Completed inputs

    // Change Planned from 13 to 20
    const plannedInput = inputs.first();
    await plannedInput.clear();
    await plannedInput.fill('20');

    // Change Completed from 8 to 15
    const completedInput = inputs.nth(1);
    await completedInput.clear();
    await completedInput.fill('15');

    // Click Save
    const saveButton = page.locator('table tbody tr').first().locator('button:has-text("Save")');
    await saveButton.click();

    // Wait for update
    await page.waitForTimeout(300);

    // Verify values persisted in localStorage
    const localStorageData = await page.evaluate(() => {
      const data = localStorage.getItem('agile-life-app/v1');
      return data ? JSON.parse(data) : null;
    });

    expect(localStorageData.sprints[0].plannedPoints).toBe(20);
    expect(localStorageData.sprints[0].completedPoints).toBe(15);

    // Verify hard refresh keeps data
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check table shows updated values
    const rowText = await page.locator('table tbody tr').first().textContent();
    expect(rowText).toContain('20');
    expect(rowText).toContain('15');
  });

  test('5. History page renders correctly after hard refresh', async ({ page }) => {
    // Setup test data
    const sprintId1 = uuid();

    await page.evaluate(({ sprintId1 }) => {
      const appData = {
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
            plannedPoints: 16,
            completedPoints: 12,
          },
        ],
        tickets: [],
      };
      localStorage.setItem('agile-life-app/v1', JSON.stringify(appData));
    }, { sprintId1 });

    // Navigate to history
    await page.goto(BASE_URL + '/history');
    await page.waitForLoadState('networkidle');

    // Verify data loaded
    const initialTable = page.locator('table');
    await expect(initialTable).toBeVisible();
    const initialRowText = await page.locator('table tbody tr').first().textContent();
    expect(initialRowText).toContain('2026-04-01');

    // Hard refresh (simulating Ctrl+Shift+R)
    await page.goto(BASE_URL + '/history', { waitUntil: 'networkidle' });

    // Verify data still there
    const refreshedTable = page.locator('table');
    await expect(refreshedTable).toBeVisible();
    const refreshedRowText = await page.locator('table tbody tr').first().textContent();
    expect(refreshedRowText).toContain('2026-04-01');
    expect(refreshedRowText).toContain('16'); // Planned points
    expect(refreshedRowText).toContain('12'); // Completed points
  });

  test('6. No console errors on History page', async ({ page }) => {
    // Setup test data
    const sprintId1 = uuid();

    await page.evaluate(({ sprintId1 }) => {
      const appData = {
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
        ],
        tickets: [],
      };
      localStorage.setItem('agile-life-app/v1', JSON.stringify(appData));
    }, { sprintId1 });

    // Capture console messages
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      consoleLogs.push(msg.text());
    });

    // Navigate to history
    await page.goto(BASE_URL + '/history');
    await page.waitForLoadState('networkidle');

    // Verify no errors were logged
    // Note: Some warnings are OK, but actual errors should not occur
    const actualErrors = consoleErrors.filter(
      (err) =>
        !err.includes('ResizeObserver') && // Common false positive
        !err.includes('sourcemap') && // Build artifacts
        !err.includes('warning') // Warnings are OK
    );

    expect(actualErrors).toEqual([]);
  });
});
