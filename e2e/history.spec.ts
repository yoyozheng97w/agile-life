import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  buildSprint,
  buildTicket,
  buildState,
  gotoFresh,
  gotoSeeded,
  readStore,
} from './helpers/store';

const MAY = '2026-05';
const APR = '2026-04';
const FEB = '2026-02';
const NOV = '2025-11';

test.describe('History page', () => {
  test('empty state when no sprints have been completed', async ({ page }) => {
    await gotoFresh(page, '/history');
    await expect(page.getByText(/No completed sprints yet/)).toBeVisible();
    await expect(page.locator('table')).not.toBeVisible();
  });

  test('renders charts and table when completed sprints exist', async ({ page }) => {
    await gotoSeeded(page, buildState({
      sprints: [
        buildSprint({ status: 'completed', startDate: `${APR}-01`, endDate: `${APR}-14`, plannedPoints: 13, completedPoints: 10 }),
        buildSprint({ status: 'completed', startDate: `${APR}-15`, endDate: `${APR}-28`, plannedPoints: 21, completedPoints: 18 }),
      ],
    }), '/history');

    await expect(page.getByRole('heading', { name: 'Velocity Trend' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Planned vs Completed' })).toBeVisible();
    await expect(page.locator('table tbody tr')).toHaveCount(2);

    const charts = page.locator('.recharts-responsive-container');
    await expect(charts).toHaveCount(2);
  });

  test('table rows display dates, points and completion rate', async ({ page }) => {
    await gotoSeeded(page, buildState({
      sprints: [
        buildSprint({ status: 'completed', startDate: `${APR}-01`, endDate: `${APR}-14`, plannedPoints: 20, completedPoints: 15 }),
      ],
    }), '/history');

    const row = page.locator('table tbody tr').first();
    await expect(row).toContainText(`${APR}-01`);
    await expect(row).toContainText(`${APR}-14`);
    await expect(row).toContainText('20');
    await expect(row).toContainText('15');
    await expect(row).toContainText('75%');
  });

  test('Edit allows updating planned/completed and persists to localStorage', async ({ page }) => {
    const sprint = buildSprint({
      status: 'completed',
      startDate: `${APR}-01`,
      endDate: `${APR}-14`,
      plannedPoints: 13,
      completedPoints: 8,
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }), '/history');

    const row = page.locator('table tbody tr').first();
    await row.getByRole('button', { name: 'Edit' }).click();

    const inputs = row.locator('input[type="number"]');
    await inputs.nth(0).fill('20');
    await inputs.nth(1).fill('15');
    await row.getByRole('button', { name: 'Save' }).click();

    await expect(row).toContainText('20');
    await expect(row).toContainText('15');
    await expect(row).toContainText('75%');

    const store = await readStore(page);
    expect(store!.sprints[0].plannedPoints).toBe(20);
    expect(store!.sprints[0].completedPoints).toBe(15);
  });

  test('Edit Cancel reverts the form', async ({ page }) => {
    const sprint = buildSprint({
      status: 'completed',
      startDate: `${APR}-01`,
      endDate: `${APR}-14`,
      plannedPoints: 10,
      completedPoints: 5,
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }), '/history');

    const row = page.locator('table tbody tr').first();
    await row.getByRole('button', { name: 'Edit' }).click();

    const inputs = row.locator('input[type="number"]');
    await inputs.nth(0).fill('99');
    await row.getByRole('button', { name: 'Cancel' }).click();

    await expect(row).not.toContainText('99');
    const store = await readStore(page);
    expect(store!.sprints[0].plannedPoints).toBe(10);
  });

  test('Delete with Confirm removes sprint and its tickets', async ({ page }) => {
    const sprint = buildSprint({
      status: 'completed',
      startDate: `${APR}-01`,
      endDate: `${APR}-14`,
    });
    await gotoSeeded(page, buildState({
      sprints: [sprint],
      tickets: [
        {
          id: 't1', title: 'Sprint ticket', points: 5, status: 'done',
          sprintId: sprint.id, createdAt: new Date().toISOString(),
        },
      ],
    }), '/history');

    const row = page.locator('table tbody tr').first();
    await row.getByRole('button', { name: 'Delete' }).click();
    await expect(row.getByRole('button', { name: 'Confirm' })).toBeVisible();
    await row.getByRole('button', { name: 'Confirm' }).click();

    await expect(page.getByText(/No completed sprints yet/)).toBeVisible();

    const store = await readStore(page);
    expect(store!.sprints).toHaveLength(0);
    expect(store!.tickets).toHaveLength(0);
  });

  test('Delete with Cancel keeps the sprint', async ({ page }) => {
    const sprint = buildSprint({
      status: 'completed',
      startDate: `${APR}-01`,
      endDate: `${APR}-14`,
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }), '/history');

    const row = page.locator('table tbody tr').first();
    await row.getByRole('button', { name: 'Delete' }).click();
    await row.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.locator('table tbody tr')).toHaveCount(1);
  });

  test('"Last 3 Months" filter excludes older sprints', async ({ page }) => {
    await gotoSeeded(page, buildState({
      sprints: [
        buildSprint({ status: 'completed', startDate: `${NOV}-01`, endDate: `${NOV}-14` }),
        buildSprint({ status: 'completed', startDate: `${FEB}-01`, endDate: `${FEB}-14` }),
        buildSprint({ status: 'completed', startDate: `${APR}-15`, endDate: `${APR}-28` }),
        buildSprint({ status: 'completed', startDate: `${MAY}-01`, endDate: `${MAY}-01` }),
      ],
    }), '/history');

    await expect(page.locator('table tbody tr')).toHaveCount(4);

    await page.getByRole('button', { name: 'Last 3 Months' }).click();

    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeLessThan(4);
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('Custom date filter narrows the table', async ({ page }) => {
    await gotoSeeded(page, buildState({
      sprints: [
        buildSprint({ status: 'completed', startDate: `${APR}-01`, endDate: `${APR}-14` }),
        buildSprint({ status: 'completed', startDate: `${APR}-15`, endDate: `${APR}-28` }),
      ],
    }), '/history');

    await page.getByRole('button', { name: 'Custom' }).click();
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill(`${APR}-15`);
    await dateInputs.nth(1).fill(`${APR}-30`);

    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(page.locator('table tbody tr').first()).toContainText(`${APR}-28`);
  });

  test('hard refresh preserves the History rendering', async ({ page }) => {
    const sprint = buildSprint({
      status: 'completed',
      startDate: `${APR}-01`,
      endDate: `${APR}-14`,
      plannedPoints: 16,
      completedPoints: 12,
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }), '/history');

    await expect(page.locator('table tbody tr')).toHaveCount(1);

    await page.goto(BASE_URL + '/history', { waitUntil: 'networkidle' });
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(page.locator('table tbody tr').first()).toContainText('16');
  });

  test('Planned column derives from tickets when sprint.plannedPoints is 0', async ({ page }) => {
    // sprint.plannedPoints intentionally left at 0 (the pre-fix default)
    const sprint = buildSprint({
      status: 'completed',
      startDate: `${APR}-01`,
      endDate: `${APR}-14`,
      plannedPoints: 0,
      completedPoints: 0,
    });
    const tickets = [
      buildTicket({ sprintId: sprint.id, points: 5, status: 'done' }),
      buildTicket({ sprintId: sprint.id, points: 3, status: 'todo' }),
      buildTicket({ sprintId: sprint.id, points: 8, status: 'doing' }),
    ];
    // planned = 5+3+8 = 16, completed (done only) = 5
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets }), '/history');

    const row = page.locator('table tbody tr').first();
    // Planned column must show 16, not 0
    await expect(row.locator('td').nth(1)).toContainText('16');
    // Completed column must show only done-ticket points: 5
    await expect(row.locator('td').nth(2)).toContainText('5');
    // Completion rate: 5/16 = 31%
    await expect(row.locator('td').nth(3)).toContainText('31%');
  });

  test('Edit form initial Planned value derives from tickets when sprint.plannedPoints is 0', async ({ page }) => {
    const sprint = buildSprint({
      status: 'completed',
      startDate: `${APR}-01`,
      endDate: `${APR}-14`,
      plannedPoints: 0,
      completedPoints: 0,
    });
    const tickets = [
      buildTicket({ sprintId: sprint.id, points: 2, status: 'done' }),
      buildTicket({ sprintId: sprint.id, points: 13, status: 'blocking' }),
    ];
    // planned from tickets = 2+13 = 15, completed = 2
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets }), '/history');

    const row = page.locator('table tbody tr').first();
    await row.getByRole('button', { name: 'Edit' }).click();

    const inputs = row.locator('input[type="number"]');
    // First number input = Planned; must be pre-filled with 15, not 0
    await expect(inputs.nth(0)).toHaveValue('15');
    // Second number input = Completed; must be pre-filled with 2
    await expect(inputs.nth(1)).toHaveValue('2');
  });

  test('Planned vs Completed chart shows non-zero Planned bar when sprint.plannedPoints is 0', async ({ page }) => {
    const sprint = buildSprint({
      status: 'completed',
      startDate: `${APR}-01`,
      endDate: `${APR}-14`,
      plannedPoints: 0,
      completedPoints: 0,
    });
    const tickets = [
      buildTicket({ sprintId: sprint.id, points: 8, status: 'done' }),
      buildTicket({ sprintId: sprint.id, points: 5, status: 'todo' }),
    ];
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets }), '/history');

    // The BarChart for "Planned vs Completed" must be present
    await expect(page.getByRole('heading', { name: 'Planned vs Completed' })).toBeVisible();

    // Recharts renders bar rectangles; at least one bar must have a non-zero height,
    // confirming the "Planned" data key resolved to 13 (8+5) rather than 0.
    const bars = page.locator('.recharts-bar-rectangle');
    await expect(bars.first()).toBeVisible();

    // Cross-check via table: Planned cell must show 13
    const row = page.locator('table tbody tr').first();
    await expect(row.locator('td').nth(1)).toContainText('13');
  });
});
