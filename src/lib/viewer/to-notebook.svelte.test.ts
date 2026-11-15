import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileFacts } from '$lib/api/viewer';
import type { MenuItem } from '$lib/ui/menu.svelte';

const fromFile = vi.hoisted(() => ({
  noteOfWords: vi.fn(async () => 'N1'),
  noteOfPicture: vi.fn(async () => 'N2'),
  sayAdded: vi.fn(),
  cutOut: vi.fn(async () => new Uint8Array([1])),
}));
vi.mock('$lib/notebook/from-file', async (original) => ({
  ...(await original<typeof import('$lib/notebook/from-file')>()),
  ...fromFile,
}));
const store = vi.hoisted(() => ({
  references: [] as { id: string; authors: string; year: string; title: string }[],
}));
vi.mock('$lib/files/store.svelte', () => ({
  files: { get: () => ({ references: store.references }) },
  referenceWords: (r: { authors: string; year: string }) => `${r.authors} ${r.year}`,
}));
vi.mock('$lib/notebook/files', () => ({ heldFile: async () => null }));
const menus = vi.hoisted(() => ({
  open: vi.fn(),
}));
vi.mock('$lib/ui/menu.svelte', () => ({ openMenu: menus.open }));
vi.mock('$lib/ui/toast.svelte', () => ({ notifyError: vi.fn() }));

const { ToNotebook } = await import('./to-notebook.svelte');

const facts = (labels: string[], picture = false) =>
  ({ name: 'treatise.pdf', pages: labels.length, labels, picture, locked: false }) as FileFacts;

/** A bar with the button, over pages of a PDF whose lines are placed as the viewer places them. */
function shown(...each: string[][]): HTMLElement {
  const root = document.createElement('div');
  const button = document.createElement('button');
  button.dataset.viewerNotebook = '';
  root.append(button);
  each.forEach((lines, i) => {
    const page = document.createElement('div');
    page.dataset.page = String(i + 1);
    const text = document.createElement('div');
    text.dataset.pageText = String(i + 1);
    lines.forEach((words, j) => {
      const line = document.createElement('div');
      line.className = 'line';
      line.style.top = `${10 + 2.5 * j}%`;
      line.style.height = '2%';
      const span = document.createElement('span');
      span.textContent = words;
      line.append(span);
      text.append(line);
    });
    page.append(text);
    root.append(page);
  });
  document.body.replaceChildren(root);
  return root;
}

function select(root: HTMLElement, from: [number, number], to: [number, number]) {
  const text = (page: number, line: number) =>
    root.querySelectorAll(`[data-page-text="${page}"] .line span`)[line].firstChild!;
  const range = document.createRange();
  range.setStart(text(from[0], from[1]), 0);
  const end = text(to[0], to[1]);
  range.setEnd(end, end.textContent!.length);
  const selection = document.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

beforeEach(() => {
  vi.clearAllMocks();
  store.references = [];
  document.getSelection()?.removeAllRanges();
});

describe('To the notebook', () => {
  it('sends the words selected, joined, with the reference and the pages in print', async () => {
    store.references = [{ id: 'R1', authors: 'Lind', year: '1990', title: 'A Short Treatise' }];
    const root = shown(['A Short Treatise on owls and their hab-'], ['its in winter.']);
    select(root, [1, 0], [2, 0]);
    const button = new ToNotebook(() => ({ file: 'H1', facts: facts(['232', '233']), root }));
    await button.press();
    expect(fromFile.noteOfWords).toHaveBeenCalledWith(
      'A Short Treatise on owls and their habits in winter.',
      { sort: 'reference', reference: 'R1', locator: '232–233' },
    );
    expect(fromFile.sayAdded).toHaveBeenCalledWith('N1');
    expect(button.marking).toBe(false);
    // The selection stays.
    expect(document.getSelection()!.isCollapsed).toBe(false);
  });

  it('with nothing selected marks a part of a page, whose picture goes with the file and its page', async () => {
    const root = shown(['One line']);
    const button = new ToNotebook(() => ({ file: 'H1', facts: facts(['ix']), root }));
    await button.press();
    expect(button.marking).toBe(true);
    expect(fromFile.noteOfWords).not.toHaveBeenCalled();
    const canvas = document.createElement('canvas');
    await button.marked({ canvas, rect: { x: 1, y: 2, width: 3, height: 4 }, page: 1 });
    expect(button.marking).toBe(false);
    expect(fromFile.cutOut).toHaveBeenCalledWith(canvas, { x: 1, y: 2, width: 3, height: 4 });
    expect(fromFile.noteOfPicture).toHaveBeenCalledWith('treatise ix.png', new Uint8Array([1]), {
      sort: 'file',
      name: 'treatise.pdf',
      locator: 'ix',
    });
  });

  it('pressed again while marking gives the marking up', async () => {
    const root = shown(['One line']);
    const button = new ToNotebook(() => ({ file: 'H1', facts: facts(['1']), root }));
    await button.press();
    await button.press();
    expect(button.marking).toBe(false);
  });

  it('asks which reference where there are several, once for the file', async () => {
    store.references = [
      { id: 'R1', authors: 'Lind', year: '1990', title: 'One' },
      { id: 'R2', authors: 'Berg', year: '2001', title: 'Two' },
    ];
    menus.open.mockImplementation((_anchor: HTMLElement, items: MenuItem[]) => {
      const berg = items.find((i) => 'label' in i && i.label === 'Berg 2001');
      (berg as { action: () => void }).action();
    });
    const root = shown(['Words on a page']);
    const button = new ToNotebook(() => ({ file: 'H9', facts: facts(['5']), root }));
    select(root, [1, 0], [1, 0]);
    await button.press();
    expect(menus.open).toHaveBeenCalledTimes(1);
    expect(menus.open.mock.calls[0][0]).toBe(root.querySelector('[data-viewer-notebook]'));
    expect(fromFile.noteOfWords).toHaveBeenLastCalledWith('Words on a page', {
      sort: 'reference',
      reference: 'R2',
      locator: '5',
    });
    await button.press();
    expect(menus.open).toHaveBeenCalledTimes(1);
    expect(fromFile.noteOfWords).toHaveBeenCalledTimes(2);
  });

  it('sends nothing where the menu is left without a choice', async () => {
    store.references = [
      { id: 'R1', authors: 'Lind', year: '1990', title: 'One' },
      { id: 'R2', authors: 'Berg', year: '2001', title: 'Two' },
    ];
    menus.open.mockImplementation(
      (_anchor: HTMLElement, _items: MenuItem[], options: { onclose: () => void }) =>
        options.onclose(),
    );
    const root = shown(['Words on a page']);
    const button = new ToNotebook(() => ({ file: 'H10', facts: facts(['5']), root }));
    select(root, [1, 0], [1, 0]);
    await button.press();
    expect(fromFile.noteOfWords).not.toHaveBeenCalled();
    expect(button.marking).toBe(false);
  });
});
