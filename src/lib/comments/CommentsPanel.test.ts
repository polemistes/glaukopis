import { describe, expect, it, vi } from 'vitest';

// The panel is mounted and written in, so with the browser's Svelte: the
// tests otherwise run with the server's, in which nothing is followed.
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

const { flushSync, mount, tick, unmount } = await import('svelte');
const { SvelteMap } = await import('svelte/reactivity');
const { Project } = await import('$lib/project/model/project.svelte');
const { PROJECT } = await import('$lib/project/model/types');
const { Drafts } = await import('$lib/project/drafts.svelte');
const { commentsUi } = await import('./ui.svelte');
const { answerField, BEGINNING_FIELD, noteField } = await import('./unsent');
const { default: CommentsPanel } = await import('./CommentsPanel.svelte');
type Beginning = import('./unsent').Beginning;

/** What the open project keeps for the panel, and is followed: what is written, and the comment being begun. */
function keeper() {
  const held = new SvelteMap<string, Beginning | null>();
  return {
    drafts: new Drafts(),
    get beginning() {
      return held.get('beginning') ?? null;
    },
    set beginning(to: Beginning | null) {
      held.set('beginning', to);
    },
  };
}

function newProject() {
  const project = new Project(null);
  project.begin('Wrath');
  project.setMe({ id: 'hector', name: 'Hector' });
  return project;
}

/** Shows the panel, with what is kept for it bound as the window binds it. */
function show(project: InstanceType<typeof Project>, kept: ReturnType<typeof keeper>) {
  const target = document.createElement('div');
  document.body.append(target);
  const panel = mount(CommentsPanel, {
    target,
    props: {
      project,
      at: PROJECT,
      drafts: kept.drafts,
      get beginning() {
        return kept.beginning;
      },
      set beginning(to: Beginning | null) {
        kept.beginning = to;
      },
      onclose: () => {},
      ongo: () => {},
    },
  });
  flushSync();
  const hide = () => {
    unmount(panel);
    target.remove();
  };
  const button = (words: string) =>
    [...target.querySelectorAll('button')].find((b) => b.textContent?.trim() === words);
  return { target, hide, button };
}

const write = (field: HTMLTextAreaElement, text: string) => {
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
};

const press = (field: HTMLElement, key: string) => {
  field.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
};

const answering = (target: HTMLElement) =>
  target.querySelector<HTMLTextAreaElement>('.answering textarea')!;
const beginningOf = (target: HTMLElement) =>
  target.querySelector<HTMLTextAreaElement>('[data-comment-beginning] textarea');

describe('what is written in the panel of comments and not yet sent', () => {
  it('is there, under its thread, when the panel is shown again, until the answer is sent', () => {
    const project = newProject();
    const thread = project.comment(PROJECT, null, 'Is this the proem?')!;
    const kept = keeper();
    const first = show(project, kept);
    write(answering(first.target), 'It is, but');
    expect(kept.drafts.of(answerField(thread))).toBe('It is, but');
    first.hide();

    const again = show(project, kept);
    expect(answering(again.target).value).toBe('It is, but');
    write(answering(again.target), 'It is.');
    press(answering(again.target), 'Enter');
    expect(project.comments.get(thread)!.notes.map((n) => n.text)).toEqual([
      'Is this the proem?',
      'It is.',
    ]);
    expect(answering(again.target).value).toBe('');
    expect(kept.drafts.has(answerField(thread))).toBe(false);
    again.hide();
  });

  it('keeps a comment that is being begun, with its words, until it is made', async () => {
    const project = newProject();
    const kept = keeper();
    const first = show(project, kept);
    expect(beginningOf(first.target)).toBeNull();
    commentsUi.begin(PROJECT);
    flushSync();
    await tick();
    // The project keeps it from then on, and nothing more is asked of the window.
    expect(kept.beginning).toEqual({ element: PROJECT, passage: null });
    expect(commentsUi.composing).toBeNull();
    write(beginningOf(first.target)!, 'Begin with the wrath');
    first.hide();

    const again = show(project, kept);
    expect(beginningOf(again.target)!.value).toBe('Begin with the wrath');
    again.button('Comment')!.click();
    flushSync();
    expect([...project.comments.values()].map((t) => t.notes[0].text)).toEqual([
      'Begin with the wrath',
    ]);
    expect(kept.beginning).toBeNull();
    expect(kept.drafts.has(BEGINNING_FIELD)).toBe(false);
    expect(beginningOf(again.target)).toBeNull();
    again.hide();
  });

  it('keeps nothing of a comment whose beginning is cancelled', async () => {
    const project = newProject();
    const kept = keeper();
    const { target, hide, button } = show(project, kept);
    commentsUi.begin(PROJECT);
    flushSync();
    await tick();
    write(beginningOf(target)!, 'On second thought');
    button('Cancel')!.click();
    flushSync();
    expect(kept.beginning).toBeNull();
    expect(kept.drafts.fields()).toEqual([]);
    expect(project.comments.size).toBe(0);
    hide();
  });

  it('keeps a note being changed as it is changed, until the change is saved or given up', async () => {
    const project = newProject();
    const thread = project.comment(PROJECT, null, 'Is this the proem?')!;
    const note = project.comments.get(thread)!.notes[0].id;
    const field = noteField(thread, note);
    const changing = (target: HTMLElement) =>
      target.querySelector<HTMLTextAreaElement>(`[data-note-edit="${note}"]`);
    const kept = keeper();
    const first = show(project, kept);
    expect(changing(first.target)).toBeNull();
    first.target.querySelector<HTMLButtonElement>('.own button')!.click();
    flushSync();
    await tick();
    expect(changing(first.target)!.value).toBe('Is this the proem?');
    // Emptied to be written anew, it is still being changed.
    write(changing(first.target)!, '');
    expect(changing(first.target)).not.toBeNull();
    write(changing(first.target)!, 'Is this the whole proem?');
    first.hide();

    const again = show(project, kept);
    expect(changing(again.target)!.value).toBe('Is this the whole proem?');
    again.button('Cancel')!.click();
    flushSync();
    expect(changing(again.target)).toBeNull();
    expect(kept.drafts.has(field)).toBe(false);
    expect(project.comments.get(thread)!.notes[0].text).toBe('Is this the proem?');

    again.target.querySelector<HTMLButtonElement>('.own button')!.click();
    flushSync();
    await tick();
    write(changing(again.target)!, 'Is this the whole proem?');
    again.button('Save')!.click();
    flushSync();
    expect(project.comments.get(thread)!.notes[0].text).toBe('Is this the whole proem?');
    expect(kept.drafts.has(field)).toBe(false);
    again.hide();
  });
});
