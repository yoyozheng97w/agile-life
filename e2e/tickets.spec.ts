import { test, expect } from '@playwright/test';
import {
  buildSprint,
  buildState,
  buildTicket,
  gotoSeeded,
  readStore,
  todayISO,
  type Sprint,
} from './helpers/store';

async function setupActiveSprint(page: import('@playwright/test').Page): Promise<Sprint> {
  const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
  await gotoSeeded(page, buildState({ sprints: [sprint] }));
  return sprint;
}

test.describe('Ticket CRUD on Sprint Board', () => {
  test('Add Ticket button is only visible on To-Do column', async ({ page }) => {
    await setupActiveSprint(page);

    const addButtons = page.getByRole('button', { name: /\+ Add Ticket/ });
    await expect(addButtons).toHaveCount(1);
  });

  test('inline form creates a ticket in To-Do', async ({ page }) => {
    const sprint = await setupActiveSprint(page);

    await page.getByRole('button', { name: /\+ Add Ticket/ }).click();
    await page.getByPlaceholder('Ticket title').fill('Write design doc');
    await page.getByPlaceholder('Description (optional)').fill('Architecture overview');
    await page.locator('button:has-text("5")').first().click();
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByRole('heading', { name: 'Write design doc' })).toBeVisible();

    const store = await readStore(page);
    expect(store?.tickets).toHaveLength(1);
    expect(store?.tickets[0]).toMatchObject({
      title: 'Write design doc',
      description: 'Architecture overview',
      points: 5,
      status: 'todo',
      sprintId: sprint.id,
    });
  });

  test('Add button is disabled when title is empty', async ({ page }) => {
    await setupActiveSprint(page);

    await page.getByRole('button', { name: /\+ Add Ticket/ }).click();
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();

    await page.getByPlaceholder('Ticket title').fill('Real title');
    await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
  });

  test('Cancel button discards in-progress ticket', async ({ page }) => {
    await setupActiveSprint(page);

    await page.getByRole('button', { name: /\+ Add Ticket/ }).click();
    await page.getByPlaceholder('Ticket title').fill('Throwaway');
    await page.getByRole('button', { name: 'Cancel' }).click();

    const store = await readStore(page);
    expect(store?.tickets).toHaveLength(0);
  });

  test('column header shows aggregated points', async ({ page }) => {
    const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
    await gotoSeeded(page, buildState({
      sprints: [sprint],
      tickets: [
        buildTicket({ sprintId: sprint.id, title: 'A', points: 3, status: 'todo' }),
        buildTicket({ sprintId: sprint.id, title: 'B', points: 5, status: 'todo' }),
        buildTicket({ sprintId: sprint.id, title: 'C', points: 8, status: 'doing' }),
      ],
    }));

    const todoColumn = page.getByRole('heading', { name: /^To-Do/ });
    await expect(todoColumn).toContainText('8 pt');

    const doingColumn = page.getByRole('heading', { name: /^Doing/ });
    await expect(doingColumn).toContainText('8 pt');
  });

  test('edit ticket via menu updates fields', async ({ page }) => {
    const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
    const ticket = buildTicket({ sprintId: sprint.id, title: 'Original', points: 3 });
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets: [ticket] }));

    // Use mouse.move to trigger group-hover CSS that reveals the ⋮ button
    const card = page.locator('h3').filter({ hasText: 'Original' }).locator('..');
    const box = await card.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.locator('button[title="More options"]').click();
    // Regex anchor avoids matching "✏️ Edit Dates" button in the sprint header
    await page.locator('button').filter({ hasText: /^✏️ Edit$/ }).click();

    const titleInput = page.locator('input[placeholder="Ticket title"]');
    await titleInput.fill('Updated title');
    await page.locator('button:has-text("8")').first().click();
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.locator('h3').filter({ hasText: 'Updated title' })).toBeVisible();

    const store = await readStore(page);
    expect(store?.tickets[0]).toMatchObject({
      title: 'Updated title',
      points: 8,
    });
  });

  test('delete ticket via menu removes it', async ({ page }) => {
    const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
    const ticket = buildTicket({ sprintId: sprint.id, title: 'Delete me' });
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets: [ticket] }));

    page.on('dialog', (d) => d.accept());

    const card = page.locator('h3').filter({ hasText: 'Delete me' }).locator('..');
    const box = await card.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.locator('button[title="More options"]').click();
    await page.locator('button', { hasText: '🗑️ Delete' }).click();

    await expect(page.locator('h3').filter({ hasText: 'Delete me' })).toHaveCount(0);

    const store = await readStore(page);
    expect(store?.tickets).toHaveLength(0);
  });

  test('all 7 Fibonacci point values can be selected', async ({ page }) => {
    await setupActiveSprint(page);

    await page.getByRole('button', { name: /\+ Add Ticket/ }).click();
    await page.getByPlaceholder('Ticket title').fill('Points test');

    for (const pt of [1, 2, 3, 5, 8, 13, 21]) {
      const btn = page.locator(`button:has-text("${pt}")`).first();
      await expect(btn).toBeVisible();
    }

    await page.locator('button:has-text("21")').first().click();
    await page.getByRole('button', { name: 'Add' }).click();

    const store = await readStore(page);
    expect(store?.tickets[0].points).toBe(21);
  });

  test('long title is clamped and does not overflow the card', async ({ page }) => {
    const longTitle = 'W'.repeat(120);
    const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
    await gotoSeeded(page, buildState({
      sprints: [sprint],
      tickets: [buildTicket({ sprintId: sprint.id, title: longTitle, points: 5 })],
    }));

    // The h3 should exist and have the line-clamp class (text is truncated in CSS)
    const h3 = page.locator('h3').filter({ hasText: 'W'.repeat(10) });
    await expect(h3).toBeVisible();
    await expect(h3).toHaveClass(/line-clamp/);

    // The card should be visible and not hidden behind anything
    const card = h3.locator('..');
    await expect(card).toBeVisible();
  });

  test('carried-over tickets show the recycle indicator', async ({ page }) => {
    const oldSprint = buildSprint({ id: 'old', status: 'completed', startDate: todayISO(-30), endDate: todayISO(-16) });
    const newSprint = buildSprint({ id: 'new', startDate: todayISO(), endDate: todayISO(13) });
    await gotoSeeded(page, buildState({
      sprints: [oldSprint, newSprint],
      tickets: [
        buildTicket({
          sprintId: newSprint.id,
          title: 'Carried',
          points: 3,
          carriedFromSprintId: oldSprint.id,
        }),
      ],
    }));

    const card = page.getByRole('heading', { name: 'Carried' }).locator('..');
    await expect(card).toContainText('↻');
  });
});
