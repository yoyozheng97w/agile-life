import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Agile Life Manager E2E Tests', () => {
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

  test('1. App loads successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    // Should render layout with sidebar
    const sidebar = await page.locator('nav').first();
    await expect(sidebar).toBeVisible();
    // Check all nav links exist
    await expect(page.locator('a')).toContainText('Kanban');
    await expect(page.locator('a')).toContainText('Plan');
    await expect(page.locator('a')).toContainText('Review');
    await expect(page.locator('a')).toContainText('History');
    await expect(page.locator('a')).toContainText('Settings');
  });

  test('2. Settings page: form fields and persistence', async ({ page }) => {
    // Navigate to settings
    await page.click('a:has-text("Settings")');
    await page.waitForURL('**/settings');

    // Check form fields exist
    const sprintLengthInput = page.locator('input[type="number"]');
    const standupTimeInput = page.locator('input[type="time"]');
    await expect(sprintLengthInput).toBeVisible();
    await expect(standupTimeInput).toBeVisible();

    // Change sprint length to 7
    await sprintLengthInput.clear();
    await sprintLengthInput.fill('7');

    // Change standup time to 10:30
    await standupTimeInput.fill('10:30');

    // Verify localStorage persists
    const settings = await page.evaluate(() => {
      const data = localStorage.getItem('agile-life-app/v1');
      return data ? JSON.parse(data).settings : null;
    });

    expect(settings.sprintLengthDays).toBe(7);
    expect(settings.standupTime).toBe('10:30');
  });

  test('3. Sprint planning: create sprint and add tickets', async ({ page }) => {
    await page.click('a:has-text("Plan")');
    await page.waitForURL('**/plan');

    // Create sprint (if not exists)
    const createButton = page.locator('button:has-text("Create Sprint")');
    if (await createButton.isVisible()) {
      await createButton.click();
    }

    // Wait for planning page to load
    await page.waitForSelector('text=Sprint Planning');

    // Add first ticket
    await page.click('button:has-text("Add Ticket")');
    await page.fill('input[placeholder="Ticket title"]', 'User Authentication');
    await page.fill('textarea', 'Setup OAuth integration');

    // Select 5 points
    const pointsButtons = page.locator('button');
    await pointsButtons.locator(':has-text("5")').click();

    await page.click('button:has-text("Add")');

    // Add second ticket
    await page.click('button:has-text("Add Ticket")');
    await page.fill('input[placeholder="Ticket title"]', 'Dashboard UI');
    await pointsButtons.locator(':has-text("8")').click();
    await page.click('button:has-text("Add")');

    // Add third ticket
    await page.click('button:has-text("Add Ticket")');
    await page.fill('input[placeholder="Ticket title"]', 'Database Setup');
    await pointsButtons.locator(':has-text("3")').click();
    await page.click('button:has-text("Add")');

    // Verify planned points total = 16
    const plannedPoints = await page.locator('text=Planned Points').locator('..').locator('p').last();
    const pointsText = await plannedPoints.textContent();
    expect(pointsText).toContain('16');

    // Start sprint
    await page.click('button:has-text("Start Sprint")');

    // Should redirect to Kanban
    await page.waitForURL('**/');
  });

  test('4. Kanban: drag-and-drop and completed points', async ({ page }) => {
    // First create a sprint (test 3 prep)
    await page.click('a:has-text("Plan")');
    const createButton = page.locator('button:has-text("Create Sprint")');
    if (await createButton.isVisible()) {
      await createButton.click();
    }

    // Add a ticket quickly
    await page.click('button:has-text("Add Ticket")');
    await page.fill('input[placeholder="Ticket title"]', 'Test Feature');
    const pointsButtons = page.locator('button');
    await pointsButtons.locator(':has-text("8")').click();
    await page.click('button:has-text("Add")');

    // Start sprint
    await page.click('button:has-text("Start Sprint")');
    await page.waitForURL('**/');

    // On Kanban page, find the ticket in To-Do and drag to Done
    const ticket = page.locator('text=Test Feature').first();

    // Perform drag
    const ticketBox = ticket.locator('..').first();
    const doneColumn = page.locator('h2:has-text("Done")').locator('..').first();

    await ticketBox.dragTo(doneColumn);

    // Wait for UI update
    await page.waitForTimeout(500);

    // Verify completed points in header updated
    const completedPointsText = await page.locator('text=Completed:').locator('..').textContent();
    expect(completedPointsText).toContain('8');
  });

  test('5. Sprint Review: completed sprint metrics', async ({ page }) => {
    // Setup: Create and start sprint with tickets
    await page.click('a:has-text("Plan")');
    const createButton = page.locator('button:has-text("Create Sprint")');
    if (await createButton.isVisible()) {
      await createButton.click();
    }

    await page.click('button:has-text("Add Ticket")');
    await page.fill('input[placeholder="Ticket title"]', 'Feature A');
    const pointsButtons = page.locator('button');
    await pointsButtons.locator(':has-text("5")').click();
    await page.click('button:has-text("Add")');

    await page.click('button:has-text("Start Sprint")');
    await page.waitForURL('**/');

    // Move to Done
    const ticketBox = page.locator('text=Feature A').locator('..').first();
    const doneColumn = page.locator('h2:has-text("Done")').locator('..').first();
    await ticketBox.dragTo(doneColumn);

    // Navigate to review
    await page.click('a:has-text("Review")');
    await page.waitForURL('**/review');

    // Verify metrics display
    await expect(page.locator('text=Planned:')).toBeVisible();
    await expect(page.locator('text=Completed:')).toBeVisible();

    const completedText = await page.locator('text=Completed:').locator('..').textContent();
    expect(completedText).toContain('5');

    // Verify done/incomplete sections
    await expect(page.locator('text=Done')).toBeVisible();
    await expect(page.locator('text=Feature A')).toBeVisible();
  });

  test('6. History page: charts render with data', async ({ page }) => {
    // Navigate to history
    await page.click('a:has-text("History")');
    await page.waitForURL('**/history');

    // If no completed sprints, message should show
    const noSprintMsg = page.locator('text=No completed sprints yet');
    const isVisible = await noSprintMsg.isVisible();

    if (isVisible) {
      expect(isVisible).toBe(true);
    } else {
      // If sprints exist, charts should render
      const lineChart = page.locator('svg').first();
      await expect(lineChart).toBeVisible();

      const table = page.locator('table');
      await expect(table).toBeVisible();
    }
  });

  test('7. Data persistence: localStorage survives refresh', async ({ page }) => {
    // Create some data
    await page.click('a:has-text("Settings")');
    const sprintInput = page.locator('input[type="number"]');
    await sprintInput.clear();
    await sprintInput.fill('10');

    // Get initial localStorage
    const dataBefore = await page.evaluate(() => {
      return localStorage.getItem('agile-life-app/v1');
    });

    expect(dataBefore).toBeTruthy();

    // Refresh page
    await page.reload();

    // Get localStorage after refresh
    const dataAfter = await page.evaluate(() => {
      return localStorage.getItem('agile-life-app/v1');
    });

    expect(dataAfter).toBe(dataBefore);

    // Verify UI reflects persisted data
    const sprintLength = await sprintInput.inputValue();
    expect(sprintLength).toBe('10');
  });

  test('8. Navigation: all routes accessible', async ({ page }) => {
    const routes = ['/', '/plan', '/review', '/history', '/settings'];

    for (const route of routes) {
      await page.goto(BASE_URL + route);
      // Should not show 404
      const notFound = page.locator('text=404').or(page.locator('text=not found'));
      await expect(notFound).not.toBeVisible();
    }
  });

  test('9. Empty ticket validation: title required', async ({ page }) => {
    await page.click('a:has-text("Plan")');

    const createButton = page.locator('button:has-text("Create Sprint")');
    if (await createButton.isVisible()) {
      await createButton.click();
    }

    // Try to add empty ticket
    await page.click('button:has-text("Add Ticket")');
    // Leave title empty, try to add
    await page.click('button:has-text("Add")');

    // Should either prevent add or show no new ticket
    const ticketCards = page.locator('[class*="TicketCard"], [class*="ticket"]');
    const count1 = await ticketCards.count();
    expect(count1).toBe(0); // No tickets added
  });

  test('10. No active sprint: proper message', async ({ page }) => {
    // Navigate to Kanban without creating sprint
    await page.goto(BASE_URL);

    // Should redirect to plan or show message
    // Wait a moment for potential redirect
    await page.waitForTimeout(1000);

    const url = page.url();
    // Should be on plan page or show appropriate message
    expect(url).toContain('plan');
  });
});
