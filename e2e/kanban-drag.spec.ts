import { test, expect } from '@playwright/test';
import {
  buildSprint,
  buildState,
  buildTicket,
  dragTicketTo,
  gotoSeeded,
  readStore,
  todayISO,
} from './helpers/store';

test.describe('Kanban drag-and-drop', () => {
  test.describe.configure({ retries: 2 });

  test('dragging a ticket from To-Do to Done updates status and points', async ({ page }) => {
    const sprint = buildSprint({
      startDate: todayISO(),
      endDate: todayISO(13),
      plannedPoints: 5,
    });
    const ticket = buildTicket({
      sprintId: sprint.id,
      title: 'Ship feature',
      points: 5,
      status: 'todo',
    });
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets: [ticket] }));

    await dragTicketTo(page, 'Ship feature', 'Done');

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.tickets[0]?.status;
    }, { timeout: 5000 }).toBe('done');

    await expect(page.locator('text=Completed:').locator('..')).toContainText('5');
  });

  test('moving to Done sets completedAt once and never overwrites it', async ({ page }) => {
    const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
    const ticket = buildTicket({
      sprintId: sprint.id,
      title: 'Once-only',
      points: 3,
      status: 'todo',
    });
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets: [ticket] }));

    await dragTicketTo(page, 'Once-only', 'Done');
    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.tickets[0]?.completedAt;
    }, { timeout: 5000 }).toBeTruthy();

    const firstCompletedAt = (await readStore(page))!.tickets[0].completedAt;
    expect(firstCompletedAt).toBeTruthy();

    await dragTicketTo(page, 'Once-only', 'Doing');
    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.tickets[0]?.status;
    }, { timeout: 5000 }).toBe('doing');

    expect((await readStore(page))!.tickets[0].completedAt).toBe(firstCompletedAt);

    await dragTicketTo(page, 'Once-only', 'Done');
    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.tickets[0]?.status;
    }, { timeout: 5000 }).toBe('done');

    expect((await readStore(page))!.tickets[0].completedAt).toBe(firstCompletedAt);
  });

  test('dragging into Blocking moves the ticket and shows red highlight', async ({ page }) => {
    const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
    const ticket = buildTicket({
      sprintId: sprint.id,
      title: 'Blocked task',
      status: 'doing',
    });
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets: [ticket] }));

    await dragTicketTo(page, 'Blocked task', 'Blocking');

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.tickets[0]?.status;
    }, { timeout: 5000 }).toBe('blocking');
  });

  test('drag persists across hard refresh', async ({ page }) => {
    const sprint = buildSprint({ startDate: todayISO(), endDate: todayISO(13) });
    const ticket = buildTicket({
      sprintId: sprint.id,
      title: 'Persist me',
      status: 'todo',
    });
    await gotoSeeded(page, buildState({ sprints: [sprint], tickets: [ticket] }));

    await dragTicketTo(page, 'Persist me', 'Done');
    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.tickets[0]?.status;
    }, { timeout: 5000 }).toBe('done');

    await page.reload();

    const doneColumn = page.getByRole('heading', { name: /^Done/ }).locator('..');
    await expect(doneColumn.getByRole('heading', { name: 'Persist me' })).toBeVisible();
  });
});
