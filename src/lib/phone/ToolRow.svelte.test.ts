import { afterEach, describe, expect, it, vi } from 'vitest';

// The row is mounted and pressed, so with the browser's Svelte: the tests
// otherwise run with the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);
vi.mock(
  'svelte/reactivity',
  // @ts-expect-error: the same.
  () => import('../../../node_modules/svelte/src/reactivity/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
const { SvelteMap } = await import('svelte/reactivity');
const { default: ToolRow } = await import('./ToolRow.svelte');

let done = () => {};
afterEach(() => {
  done();
  done = () => {};
});

type Live = 'focused' | 'canUndo' | 'taking';

/** The row mounted, with what it is given; what changes while it stands is set by `set`. */
function setUp(given: Partial<Record<Live, boolean>> = {}) {
  const live = new SvelteMap<Live, boolean>([
    ['focused', false],
    ['canUndo', false],
    ['taking', false],
    ...(Object.entries(given) as [Live, boolean][]),
  ]);
  const onrun = vi.fn();
  const onundo = vi.fn();
  const ontake = vi.fn();
  const target = document.createElement('div');
  document.body.append(target);
  const view = mount(ToolRow, {
    target,
    props: {
      state: null,
      get focused() {
        return live.get('focused')!;
      },
      get canUndo() {
        return live.get('canUndo')!;
      },
      get taking() {
        return live.get('taking')!;
      },
      onrun,
      onundo,
      ontake,
    },
  });
  flushSync();
  done = () => {
    unmount(view);
    target.remove();
  };
  const tool = (name: string) =>
    target.querySelector<HTMLButtonElement>(`[data-phone-tool="${name}"]`)!;
  const field = (name: string) =>
    target.querySelector<HTMLInputElement>(`[data-phone-input="${name}"]`)!;
  const set = (name: Live, value: boolean) => {
    live.set(name, value);
    flushSync();
  };
  /** The field is given files, as the system's picker or the camera gives them, and says so. */
  const choose = (name: string, files: File[]) => {
    const input = field(name);
    Object.defineProperty(input, 'files', { configurable: true, value: files });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
  };
  return { target, tool, field, set, choose, onrun, onundo, ontake };
}

const plate = () => new File([new Uint8Array([1, 2, 3])], 'plate.png', { type: 'image/png' });
const paper = () => new File([new Uint8Array([4, 5])], 'paper.pdf', { type: 'application/pdf' });

describe('the row of tools over the keyboard, with a file taken in', () => {
  it('has seven tools, the two that take a file in before Undo', () => {
    const { target } = setUp();
    const tools = [...target.querySelectorAll<HTMLElement>('[data-phone-tool]')];
    expect(tools.map((b) => b.dataset.phoneTool)).toEqual([
      'bold',
      'italic',
      'list',
      'todo',
      'file',
      'photograph',
      'undo',
    ]);
    expect(tools[4].getAttribute('aria-label')).toBe('Picture or file');
    expect(tools[5].getAttribute('aria-label')).toBe('Photograph');
  });

  it('has the two buttons there to be pressed whether the text has the cursor or not', () => {
    const { tool, set } = setUp({ focused: false });
    expect(tool('bold').disabled).toBe(true);
    expect(tool('file').disabled).toBe(false);
    expect(tool('photograph').disabled).toBe(false);
    set('focused', true);
    expect(tool('bold').disabled).toBe(false);
    expect(tool('file').disabled).toBe(false);
    expect(tool('photograph').disabled).toBe(false);
  });

  it('has the two buttons not there to be pressed while a file is taken in', () => {
    const { tool, set } = setUp({ focused: true });
    set('taking', true);
    expect(tool('file').disabled).toBe(true);
    expect(tool('photograph').disabled).toBe(true);
    // The tools of the text are as they were.
    expect(tool('bold').disabled).toBe(false);
    set('taking', false);
    expect(tool('file').disabled).toBe(false);
    expect(tool('photograph').disabled).toBe(false);
  });

  it('keeps the cursor and the keyboard at a press of either, and presses its own field', () => {
    const { tool, field } = setUp({ focused: true });
    const pressed: string[] = [];
    for (const name of ['file', 'photograph'])
      field(name).addEventListener('click', () => pressed.push(name));
    for (const name of ['file', 'photograph']) {
      const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      tool(name).dispatchEvent(down);
      expect(down.defaultPrevented).toBe(true);
      tool(name).click();
    }
    expect(pressed).toEqual(['file', 'photograph']);
  });

  it('has a field for the picker that takes several files of any kind, and one for the camera', () => {
    const { field } = setUp();
    const picker = field('file');
    expect(picker.type).toBe('file');
    expect(picker.multiple).toBe(true);
    expect(picker.hasAttribute('accept')).toBe(false);
    expect(picker.hidden).toBe(true);
    const camera = field('photograph');
    expect(camera.type).toBe('file');
    expect(camera.multiple).toBe(false);
    expect(camera.getAttribute('accept')).toBe('image/*');
    expect(camera.getAttribute('capture')).toBe('environment');
    expect(camera.hidden).toBe(true);
  });

  it('hands on the files chosen, with where they came from, and empties the field', () => {
    const { tool, choose, field, ontake } = setUp();
    const files = [plate(), paper()];
    tool('file').click();
    choose('file', files);
    expect(ontake).toHaveBeenCalledTimes(1);
    expect(ontake).toHaveBeenCalledWith(files, 'file', false);
    expect(field('file').value).toBe('');
    const photograph = plate();
    tool('photograph').click();
    choose('photograph', [photograph]);
    expect(ontake).toHaveBeenLastCalledWith([photograph], 'photograph', false);
  });

  it('hands on whether the text had the cursor when the button was pressed, and not when the files came', () => {
    const { tool, choose, set, ontake } = setUp({ focused: true });
    tool('file').click();
    // The picker took the cursor away from the text.
    set('focused', false);
    const files = [plate()];
    choose('file', files);
    expect(ontake).toHaveBeenLastCalledWith(files, 'file', true);
    // Pressed with no cursor, and the text has it when the files come.
    tool('photograph').click();
    set('focused', true);
    const photograph = plate();
    choose('photograph', [photograph]);
    expect(ontake).toHaveBeenLastCalledWith([photograph], 'photograph', false);
  });

  it('hands on nothing where no file was chosen', () => {
    const { choose, ontake } = setUp();
    choose('file', []);
    choose('photograph', []);
    expect(ontake).not.toHaveBeenCalled();
  });

  it('keeps Undo and the tools of the text as they were', () => {
    const { tool, set, onundo, onrun } = setUp({ focused: true });
    expect(tool('undo').disabled).toBe(true);
    set('canUndo', true);
    tool('undo').click();
    expect(onundo).toHaveBeenCalledTimes(1);
    tool('bold').click();
    expect(onrun).toHaveBeenCalledWith('bold');
  });
});
