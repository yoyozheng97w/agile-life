import { test, expect } from '@playwright/test';
import {
  buildSprint,
  buildState,
  buildTicket,
  gotoSeeded,
  readStore,
  todayISO,
} from './helpers/store';

test.describe('Sprint lifecycle - automatic transitions', () => {
  test('planning sprint becomes active when start date is reached', async ({ page }) => {
    const sprint = buildSprint({
      status: 'planning',
      startDate: todayISO(),
      endDate: todayISO(13),
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }));

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints[0]?.status;
    }).toBe('active');
  });

  test('future-dated planning sprint stays in planning', async ({ page }) => {
    const sprint = buildSprint({
      status: 'planning',
      startDate: todayISO(7),
      endDate: todayISO(20),
    });
    await gotoSeeded(page, buildState({ sprints: [sprint] }));

    await page.waitForLoadState('networkidle');
    const store = await readStore(page);
    expect(store?.sprints[0].status).toBe('planning');
  });

  test('active sprint past end date auto-closes and snapshots completed points', async ({ page }) => {
    const sprint = buildSprint({
      status: 'active',
      startDate: todayISO(-20),
      endDate: todayISO(-1),
      plannedPoints: 10,
    });
    const doneTicket = buildTicket({
      sprintId: sprint.id,
      title: 'Done item',
      points: 5,
      status: 'done',
      completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    });
    const incompleteTicket = buildTicket({
      sprintId: sprint.id,
      title: 'Carry me',
      points: 3,
      status: 'todo',
    });

    await gotoSeeded(page, buildState({
      sprints: [sprint],
      tickets: [doneTicket, incompleteTicket],
    }));

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints.find((s) => s.id === sprint.id)?.status;
    }, { timeout: 5000 }).toBe('completed');

    const store = await readStore(page);
    const closed = store!.sprints.find((s) => s.id === sprint.id)!;
    expect(closed.completedPoints).toBe(5);
  });

  test('incomplete tickets carry over to a new sprint with carriedFromSprintId set', async ({ page }) => {
    const sprint = buildSprint({
      status: 'active',
      startDate: todayISO(-20),
      endDate: todayISO(-1),
      plannedPoints: 8,
    });
    const incomplete = buildTicket({
      sprintId: sprint.id,
      title: 'Unfinished',
      points: 5,
      status: 'doing',
    });
    const blocked = buildTicket({
      sprintId: sprint.id,
      title: 'Stuck',
      points: 3,
      status: 'blocking',
    });

    await gotoSeeded(page, buildState({
      sprints: [sprint],
      tickets: [incomplete, blocked],
    }));

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints.length;
    }, { timeout: 5000 }).toBe(2);

    const store = await readStore(page);
    const newSprint = store!.sprints.find((s) => s.id !== sprint.id)!;
    // New sprint may be immediately activated if its startDate is today
    expect(['planning', 'active']).toContain(newSprint.status);
    expect(newSprint.number).toBe(sprint.number + 1);

    const carried = store!.tickets.filter((t) => t.sprintId === newSprint.id);
    expect(carried).toHaveLength(2);
    for (const t of carried) {
      expect(t.carriedFromSprintId).toBe(sprint.id);
      expect(t.status).toBe('todo');
    }

    const titles = carried.map((t) => t.title).sort();
    expect(titles).toEqual(['Stuck', 'Unfinished']);
  });

  test('done tickets do not carry over', async ({ page }) => {
    const sprint = buildSprint({
      status: 'active',
      startDate: todayISO(-20),
      endDate: todayISO(-1),
      plannedPoints: 10,
    });
    const done = buildTicket({
      sprintId: sprint.id,
      title: 'Finished',
      points: 8,
      status: 'done',
      completedAt: new Date().toISOString(),
    });

    await gotoSeeded(page, buildState({
      sprints: [sprint],
      tickets: [done],
    }));

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints.find((s) => s.id === sprint.id)?.status;
    }).toBe('completed');

    const store = await readStore(page);
    expect(store!.sprints).toHaveLength(1);
    expect(store!.tickets).toHaveLength(1);
    expect(store!.tickets[0].carriedFromSprintId).toBeUndefined();
  });

  test('sprint with no incomplete tickets does not create a new sprint', async ({ page }) => {
    const sprint = buildSprint({
      status: 'active',
      startDate: todayISO(-20),
      endDate: todayISO(-1),
      plannedPoints: 5,
    });
    const done = buildTicket({
      sprintId: sprint.id,
      title: 'All done',
      points: 5,
      status: 'done',
      completedAt: new Date().toISOString(),
    });

    await gotoSeeded(page, buildState({
      sprints: [sprint],
      tickets: [done],
    }));

    await expect.poll(async () => {
      const store = await readStore(page);
      return store?.sprints.find((s) => s.id === sprint.id)?.status;
    }).toBe('completed');

    const store = await readStore(page);
    expect(store!.sprints).toHaveLength(1);
  });
});

test.describe('Sprint Board - dynamic points display from tickets', () => {
  test('Planned points is the sum of all sprint tickets regardless of sprint.plannedPoints', async ({ page }) => {
    // sprint.plannedPoints is 0 (the initial default) — the UI must derive the value from tickets
    const sprint = buildSprint({
      status: 'active',
      startDate: todayISO(),
      endDate: todayISO(13),
      plannedPoints: 0,
    });
    const t1 = buildTicket({ sprintId: sprint.id, points: 5, status: 'todo' });
    const t2 = buildTicket({ sprintId: sprint.id, points: 3, status: 'doing' });
    const t3 = buildTicket({ sprintId: sprint.id, points: 8, status: 'done', completedAt: new Date().toISOString() });

    await gotoSeeded(page, buildState({ sprints: [sprint], tickets: [t1, t2, t3] }), '/');

    // 5 + 3 + 8 = 16
    await expect(page.locator('text=Planned:').locator('..')).toContainText('16 points');
  });

  test('Completed points counts only done tickets', async ({ page }) => {
    const sprint = buildSprint({
      status: 'active',
      startDate: todayISO(),
      endDate: todayISO(13),
      plannedPoints: 0,
      completedPoints: 0,
    });
    const todo   = buildTicket({ sprintId: sprint.id, points: 5,  status: 'todo' });
    const doing  = buildTicket({ sprintId: sprint.id, points: 3,  status: 'doing' });
    const blocking = buildTicket({ sprintId: sprint.id, points: 2, status: 'blocking' });
    const done1  = buildTicket({ sprintId: sprint.id, points: 8,  status: 'done', completedAt: new Date().toISOString() });
    const done2  = buildTicket({ sprintId: sprint.id, points: 13, status: 'done', completedAt: new Date().toISOString() });

    await gotoSeeded(page, buildState({ sprints: [sprint], tickets: [todo, doing, blocking, done1, done2] }), '/');

    // Planned = 5+3+2+8+13 = 31
    await expect(page.locator('text=Planned:').locator('..')).toContainText('31 points');
    // Completed = 8+13 = 21 (only done tickets)
    await expect(page.locator('text=Completed:').locator('..')).toContainText('21');
  });
});
