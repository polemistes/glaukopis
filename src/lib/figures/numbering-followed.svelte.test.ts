import { describe, expect, it, vi } from 'vitest';
import { prosemirrorToYXmlFragment } from 'y-prosemirror';
import { bodySchema } from '$lib/editor/schema';
import { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import { numbering } from './numbering.svelte';

// The tests run with the server's Svelte, in which nothing is followed;
// here the effects of the page are what is tested, so the browser's.
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
const { flushSync } = await import('svelte');

const { paragraph, figure } = bodySchema.nodes;
const fig = (id: string, said: string) =>
  figure.create(
    { id, file: 'a'.repeat(64), extension: 'png', name: `${id}.png`, numbered: true },
    bodySchema.text(said),
  );
const text = (words: string) => paragraph.create(null, bodySchema.text(words));

function write(p: Project, element: string, ...blocks: ReturnType<typeof text>[]) {
  p.transact(() =>
    prosemirrorToYXmlFragment(bodySchema.node('doc', null, blocks), p.fragment(element, 'body')!),
  );
}

/** A microtask, in which the project tells of its changes. */
const told = async () => {
  await Promise.resolve();
  await Promise.resolve();
  flushSync();
};

describe('what shows the numbers of a document', () => {
  it('is done again when a number changes, not for every word typed', async () => {
    const p = new Project(null);
    p.begin('Wrath');
    const top = p.addChild(PROJECT, { title: 'Wrath' })!;
    const a = p.addChild(top, { title: 'The word' })!;
    const b = p.addChild(top, { title: 'The shield' })!;
    write(p, a, text('Text.'), fig('f1', 'A vase'));
    write(p, b, fig('f2', 'The shield'), text('After.'));

    // Ten figures on the screen, each showing its number.
    const shown: (string | null | undefined)[] = [];
    let runs = 0;
    const stop = $effect.root(() => {
      for (let i = 0; i < 10; i++)
        $effect(() => {
          runs++;
          shown[i] = numbering.of(p, top).byId.get('f2')?.number;
        });
    });
    flushSync();
    expect(runs).toBe(10);
    expect(shown[0]).toBe('2');
    // The template and the layout the document asks for are looked for, and are not found here.
    for (let i = 0; i < 5; i++) await told();
    runs = 0;

    for (const words of ['After', 'After,', 'After, and', 'After, and more.']) {
      write(p, b, fig('f2', 'The shield'), text(words));
      await told();
    }
    expect(runs).toBe(0);

    write(p, a, text('Text.'), fig('f0', 'A map'), fig('f1', 'A vase'));
    await told();
    expect(runs).toBe(10);
    expect(shown.every((n) => n === '3')).toBe(true);
    stop();
  });
});
