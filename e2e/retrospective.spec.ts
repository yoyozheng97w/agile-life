import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  buildSprint,
  buildState,
  gotoFresh,
  gotoSeeded,
  readStore,
} from './helpers/store';

test.describe('Retrospective page', () => {
  test('empty state when no sprints have been completed', async ({ page }) => {
    await gotoFresh(page, '/retro');
    await expect(page.getByText(/No completed sprints yet/)).toBeVisible();
  });

  test('lists completed sprints in the sidebar', async ({ page }) => {
    await gotoSeeded(page, buildState({
      sprints: [
        buildSprint({ id: 's1', number: 1, status: 'completed', startDate: '2026-04-01', endDate: '2026-04-14' }),
        buildSprint({ id: 's2', number: 2, status: 'completed', startDate: '2026-04-15', endDate: '2026-04-28' }),
      ],
    }), '/retro');

    const sprintButtons = page.locator('button').filter({ hasText: /Apr \d+ – Apr \d+/ });
    await expect(sprintButtons).toHaveCount(2);
  });

  test('selecting a sprint without notes prompts to write one', async ({ page }) => {
    await gotoSeeded(page, buildState({
      sprints: [
        buildSprint({ id: 's1', status: 'completed', startDate: '2026-04-01', endDate: '2026-04-14' }),
      ],
    }), '/retro');

    await page.locator('button').filter({ hasText: /Apr 1 – Apr 14/ }).click();

    await expect(page.getByText('No retrospective notes yet')).toBeVisible();
    await expect(page.getByRole('button', { name: /Edit/ })).toBeVisible();
  });

  test('writing and saving notes persists to localStorage', async ({ page }) => {
    const sprint = buildSprint({
      id: 's1',
      status: 'completed',
      startDate: '2026-04-01',
      endDate: '2026-04-14',
      plannedPoints: 13,
      completedPoints: 10,
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }), '/retro');

    await page.locator('button').filter({ hasText: /Apr 1 – Apr 14/ }).click();
    await page.getByRole('button', { name: /Edit/ }).click();

    const text = 'Velocity was strong; biggest issue was unclear scope on the auth ticket.';
    await page.locator('textarea').fill(text);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(text)).toBeVisible();

    const store = await readStore(page);
    expect(store!.sprints[0].retrospective).toBe(text);
  });

  test('a sprint with notes shows the "Has notes" indicator', async ({ page }) => {
    await gotoSeeded(page, buildState({
      sprints: [
        buildSprint({
          id: 's1',
          status: 'completed',
          startDate: '2026-04-01',
          endDate: '2026-04-14',
          retrospective: 'Already written',
        }),
      ],
    }), '/retro');

    await expect(page.getByText('✓ Has notes')).toBeVisible();
  });

  test('Cancel discards in-progress edits', async ({ page }) => {
    const sprint = buildSprint({
      id: 's1',
      status: 'completed',
      startDate: '2026-04-01',
      endDate: '2026-04-14',
      retrospective: 'Original notes',
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }), '/retro');

    await page.locator('button').filter({ hasText: /Apr 1 – Apr 14/ }).click();
    await page.getByRole('button', { name: /Edit/ }).click();

    await page.locator('textarea').fill('Discarded edit');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('Original notes')).toBeVisible();
    const store = await readStore(page);
    expect(store!.sprints[0].retrospective).toBe('Original notes');
  });

  test('notes survive a hard refresh', async ({ page }) => {
    const sprint = buildSprint({
      id: 's1',
      status: 'completed',
      startDate: '2026-04-01',
      endDate: '2026-04-14',
      retrospective: 'Persistent thoughts',
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }), '/retro');

    await page.locator('button').filter({ hasText: /Apr 1 – Apr 14/ }).click();
    await expect(page.getByText('Persistent thoughts')).toBeVisible();

    await page.goto(BASE_URL + '/retro', { waitUntil: 'networkidle' });
    await page.locator('button').filter({ hasText: /Apr 1 – Apr 14/ }).click();
    await expect(page.getByText('Persistent thoughts')).toBeVisible();
  });
});
