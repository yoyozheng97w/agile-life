import { type Page, expect } from '@playwright/test';

export type SprintStatus = 'planning' | 'active' | 'completed';
export type TicketStatus = 'todo' | 'doing' | 'blocking' | 'done';
export type Points = 1 | 2 | 3 | 5 | 8 | 13 | 21;

export interface Settings {
  sprintLengthDays: number;
  standupTime: string;
  notificationsEnabled: boolean;
}

export interface Sprint {
  id: string;
  number: number;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  plannedPoints: number;
  completedPoints: number;
  retrospective?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  points: Points;
  status: TicketStatus;
  sprintId: string;
  createdAt: string;
  completedAt?: string;
  carriedFromSprintId?: string;
}

export interface AppState {
  state: {
    settings: Settings;
    sprints: Sprint[];
    tickets: Ticket[];
  };
  version: number;
}

export const PERSIST_KEY = 'agile-life-app/v1';
export const BASE_URL = 'http://localhost:5173';

export const DEFAULT_SETTINGS: Settings = {
  sprintLengthDays: 14,
  standupTime: '09:30',
  notificationsEnabled: false,
};

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

let counter = 0;
export function uid(prefix = 'test'): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function buildSprint(overrides: Partial<Sprint> = {}): Sprint {
  return {
    id: uid('sprint'),
    number: 1,
    startDate: todayISO(),
    endDate: todayISO(13),
    status: 'active',
    plannedPoints: 0,
    completedPoints: 0,
    ...overrides,
  };
}

export function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: uid('ticket'),
    title: 'Sample Ticket',
    points: 3,
    status: 'todo',
    sprintId: 'sprint-placeholder',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildState(
  partial: Partial<AppState['state']> = {}
): AppState['state'] {
  return {
    settings: DEFAULT_SETTINGS,
    sprints: [],
    tickets: [],
    ...partial,
  };
}

export async function clearStore(page: Page): Promise<void> {
  await page.goto(BASE_URL);
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, PERSIST_KEY);
}

export async function seedStore(page: Page, state: AppState['state']): Promise<void> {
  await page.goto(BASE_URL);
  await page.evaluate(
    ({ key, payload }) => {
      localStorage.setItem(key, JSON.stringify(payload));
    },
    { key: PERSIST_KEY, payload: { state, version: 1 } }
  );
}

export async function readStore(page: Page): Promise<AppState['state'] | null> {
  return await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state ?? parsed;
  }, PERSIST_KEY);
}

export async function gotoFresh(page: Page, path = '/'): Promise<void> {
  await clearStore(page);
  await page.goto(BASE_URL + path);
}

export async function gotoSeeded(
  page: Page,
  state: AppState['state'],
  path = '/'
): Promise<void> {
  await seedStore(page, state);
  await page.goto(BASE_URL + path);
}

export async function expectNoConsoleErrors(
  page: Page,
  action: () => Promise<void>
): Promise<void> {
  const errors: string[] = [];
  const handler = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        !text.includes('ResizeObserver') &&
        !text.includes('sourcemap')
      ) {
        errors.push(text);
      }
    }
  };
  page.on('console', handler);
  try {
    await action();
  } finally {
    page.off('console', handler);
  }
  expect(errors, `Console errors detected:\n${errors.join('\n')}`).toEqual([]);
}

export async function dragTicketTo(
  page: Page,
  ticketTitle: string,
  targetColumnLabel: 'To-Do' | 'Doing' | 'Blocking' | 'Done'
): Promise<void> {
  const card = page.locator(`h3:has-text("${ticketTitle}")`).locator('..');
  const target = page.locator(`h2:has-text("${targetColumnLabel}")`).locator('..');

  const cardBox = await card.boundingBox();
  const targetBox = await target.boundingBox();
  if (!cardBox || !targetBox) {
    throw new Error('Could not locate card or target column for drag');
  }

  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + 100,
    { steps: 20 }
  );
  await page.mouse.up();
}
