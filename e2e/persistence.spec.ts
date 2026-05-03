import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  PERSIST_KEY,
  buildSprint,
  buildState,
  buildTicket,
  gotoFresh,
  gotoSeeded,
  readStore,
  todayISO,
} from './helpers/store';

test.describe('Data persistence and integrity', () => {
  test('schema in localStorage matches the documented shape', async ({ page }) => {
    await gotoFresh(page, '/settings');
    await page.locator('input[type="number"]').fill('10');
    await page.locator('input[type="number"]').blur();

    // wait for Zustand persist to write
    await expect.poll(async () => {
      const raw = await page.evaluate((key) => localStorage.getItem(key), PERSIST_KEY);
      return raw !== null;
    }).toBe(true);

    const raw = await page.evaluate((key) => localStorage.getItem(key), PERSIST_KEY);
    const parsed = JSON.parse(raw!);

    expect(parsed).toMatchObject({
      version: 1,
      state: {
        settings: {
          sprintLengthDays: expect.any(Number),
          standupTime: expect.any(String),
          notificationsEnabled: expect.any(Boolean),
        },
        sprints: expect.any(Array),
        tickets: expect.any(Array),
      },
    });
  });

  test('a complete app state survives a hard refresh end-to-end', async ({ page }) => {
    const activeSprint = buildSprint({
      id: 'active',
      status: 'active',
      startDate: todayISO(),
      endDate: todayISO(13),
      plannedPoints: 8,
    });
    const completedSprint = buildSprint({
      id: 'old',
      number: 0,
      status: 'completed',
      startDate: todayISO(-30),
      endDate: todayISO(-16),
      plannedPoints: 13,
      completedPoints: 13,
      retrospective: 'Last sprint went well',
    });

    await gotoSeeded(page, buildState({
      sprints: [completedSprint, activeSprint],
      tickets: [
        buildTicket({ sprintId: activeSprint.id, title: 'Live work', points: 5, status: 'doing' }),
        buildTicket({ sprintId: activeSprint.id, title: 'Done thing', points: 3, status: 'done', completedAt: new Date().toISOString() }),
        buildTicket({ sprintId: completedSprint.id, title: 'History item', points: 13, status: 'done', completedAt: new Date(Date.now() - 86400000 * 20).toISOString() }),
      ],
    }));

    await expect(page.getByRole('heading', { name: 'Live work' })).toBeVisible();

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Live work' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Done thing' })).toBeVisible();

    await page.goto(BASE_URL + '/history', { waitUntil: 'networkidle' });
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(page.locator('table tbody tr').first()).toContainText('13');

    await page.goto(BASE_URL + '/retro', { waitUntil: 'networkidle' });
    await page.locator('button').filter({ hasText: /– /  }).first().click();
    await expect(page.getByText('Last sprint went well')).toBeVisible();
  });

  test('clearing localStorage returns the app to empty state', async ({ page }) => {
    await gotoSeeded(page, buildState({
      sprints: [buildSprint({ status: 'active', startDate: todayISO(), endDate: todayISO(13) })],
      tickets: [],
    }));

    await expect(page.getByRole('heading', { name: /^To-Do/ })).toBeVisible();

    await page.evaluate((key) => localStorage.removeItem(key), PERSIST_KEY);
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Create Sprint' })).toBeVisible();
  });

  test('seeded ticket counts are preserved exactly', async ({ page }) => {
    const sprint = buildSprint({ status: 'active', startDate: todayISO(), endDate: todayISO(13) });
    const tickets = [
      buildTicket({ sprintId: sprint.id, title: 'Seed Todo', points: 1, status: 'todo' }),
      buildTicket({ sprintId: sprint.id, title: 'Seed Doing', points: 2, status: 'doing' }),
      buildTicket({ sprintId: sprint.id, title: 'Seed Block', points: 3, status: 'blocking' }),
      buildTicket({ sprintId: sprint.id, title: 'Seed Done', points: 5, status: 'done', completedAt: new Date().toISOString() }),
    ];
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets }));

    const store = await readStore(page);
    expect(store!.tickets).toHaveLength(4);

    for (const title of ['Seed Todo', 'Seed Doing', 'Seed Block', 'Seed Done']) {
      await expect(page.locator('h3').filter({ hasText: title })).toBeVisible();
    }
  });
});
