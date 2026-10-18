import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { writeBody } from './model/blocks';
import { Project } from './model/project.svelte';
import { paragraph, type Block } from './model/text';
import { PROJECT } from './model/types';
import { PictureSync, pictureSet } from './shared-pictures';

const figure = (file: string): Block => ({
  kind: 'figure',
  id: `f-${file.slice(0, 4)}`,
  file,
  extension: 'png',
  name: '',
  caption: [],
  alt: '',
  width: 100,
  numbered: true,
});

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);

/** A shared project with an element of text, and how many times its pictures are synced. */
function shared() {
  const project = new Project(null);
  project.begin('Wrath');
  const element = project.addChild(PROJECT, { title: 'Part' })!;
  project.transact(() => writeBody(project.fragment(element, 'body')!, [paragraph([])]));
  const sync = new PictureSync();
  let synced = 0;
  let connected = false;
  // As the view does: asked again on every change of the project.
  const look = () => {
    if (sync.wanted(pictureSet(project), connected)) synced++;
  };
  project.onChange(look);
  const settle = () => new Promise((done) => queueMicrotask(() => done(null)));
  const write = async (text: string) => {
    project.transact(() => {
      const p = project.fragment(element, 'body')!.get(0) as Y.XmlElement;
      if (!p.length) p.insert(0, [new Y.XmlText()]);
      (p.get(0) as Y.XmlText).insert(0, text);
    });
    await settle();
  };
  const show = async (...blocks: Block[]) => {
    project.transact(() => {
      const body = project.fragment(element, 'body')!;
      body.delete(0, body.length);
      writeBody(body, [paragraph([]), ...blocks]);
    });
    await settle();
  };
  const connect = (on: boolean) => {
    connected = on;
    look();
  };
  return { synced: () => synced, write, show, connect };
}

describe('the pictures of a shared project', () => {
  it('are synced when the connection is, and not on every keystroke', async () => {
    const s = shared();
    await s.write('S');
    expect(s.synced()).toBe(0);
    s.connect(true);
    expect(s.synced()).toBe(1);
    for (const letter of 'ing, goddess') await s.write(letter);
    expect(s.synced()).toBe(1);
    // A connection lost and found again syncs again.
    s.connect(false);
    s.connect(true);
    expect(s.synced()).toBe(2);
  });

  it('are synced again when the project uses a picture it did not, or no longer uses one', async () => {
    const s = shared();
    s.connect(true);
    await s.show(figure(A));
    expect(s.synced()).toBe(2);
    // The same picture, elsewhere in the text: the same set.
    await s.show(paragraph([]), figure(A));
    await s.write('Then ');
    expect(s.synced()).toBe(2);
    await s.show(figure(A), figure(B));
    expect(s.synced()).toBe(3);
    await s.show(figure(B));
    expect(s.synced()).toBe(4);
  });
});
