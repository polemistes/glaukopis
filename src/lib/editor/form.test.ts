import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ySyncPlugin } from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import projectfile from '/crates/core/src/projectfile.rs?raw';
import {
  FORM,
  formInUpdate,
  formOf,
  formOfElements,
  formOfText,
  formOfStored,
  raiseForm,
  saysForm,
} from './form';
import { bodySchema } from './schema';

/** A text of two paragraphs, and between them a block no schema of ours has. */
function withUnknownBlock(doc: Y.Doc): Y.XmlFragment {
  const text = doc.getXmlFragment('text');
  const first = new Y.XmlElement('paragraph');
  first.insert(0, [new Y.XmlText('Before.')]);
  const unknown = new Y.XmlElement('of-a-later-form');
  const inside = new Y.XmlElement('paragraph');
  inside.insert(0, [new Y.XmlText('Inside.')]);
  unknown.insert(0, [inside]);
  const last = new Y.XmlElement('paragraph');
  last.insert(0, [new Y.XmlText('After.')]);
  text.insert(0, [first, unknown, last]);
  return text;
}

let views: EditorView[] = [];

function show(fragment: Y.XmlFragment): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const view = new EditorView(place, {
    state: EditorState.create({ schema: bodySchema, plugins: [ySyncPlugin(fragment)] }),
  });
  views.push(view);
  return view;
}

afterEach(() => {
  for (const v of views) v.destroy();
  views = [];
  document.body.innerHTML = '';
});

describe('the form of the texts', () => {
  it('is the first where a document says none', () => {
    expect(formOf(new Y.Doc())).toBe(1);
    expect(formOfStored(null, [])).toBe(1);
    const doc = new Y.Doc();
    doc.getMap('meta').set('name', 'A project');
    expect(formOfStored(Y.encodeStateAsUpdate(doc), [])).toBe(1);
  });

  it('is the highest a document says, whatever else its map holds', () => {
    const doc = new Y.Doc();
    raiseForm(doc, 3);
    raiseForm(doc, 2);
    doc.getMap('form').set('later', true);
    doc.getMap('form').set('07', true);
    doc.getMap('form').set('-4', true);
    expect(formOf(doc)).toBe(3);
  });

  it('is not raised to the first, nor twice to the same', () => {
    const doc = new Y.Doc();
    let changes = 0;
    doc.on('update', () => changes++);
    raiseForm(doc, 1);
    expect(changes).toBe(0);
    raiseForm(doc, 2);
    raiseForm(doc, 2);
    expect(changes).toBe(1);
    expect(formOf(doc)).toBe(2);
  });

  it('is read from a change before anything of it is taken in', () => {
    const doc = new Y.Doc();
    doc.getMap('meta').set('name', 'A project');
    const before = Y.encodeStateVector(doc);
    raiseForm(doc, 2);
    withUnknownBlock(doc);
    // The change alone, as it is sent to the others, and the whole, as it is kept and as a server answers.
    expect(formInUpdate(Y.encodeStateAsUpdate(doc, before))).toBe(2);
    expect(formInUpdate(Y.encodeStateAsUpdate(doc))).toBe(2);
    expect(formOfStored(null, [Y.encodeStateAsUpdate(doc)])).toBe(2);
    // And as another has it, who was sent it.
    const other = new Y.Doc();
    Y.applyUpdate(other, Y.encodeStateAsUpdate(doc));
    expect(formOf(other)).toBe(2);
    expect(formInUpdate(Y.encodeStateAsUpdate(other))).toBe(2);
  });

  it('is read from a change that two raised at once', () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    raiseForm(a, 2);
    raiseForm(b, 2);
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b));
    expect(formOf(a)).toBe(2);
    expect(formInUpdate(Y.encodeStateAsUpdate(a))).toBe(2);
  });

  it('says none for a change that says none, and for bytes that are no change', () => {
    const doc = new Y.Doc();
    // A text that speaks of forms is not one.
    doc.getXmlFragment('text').insert(0, [new Y.XmlText('form 2')]);
    doc.getMap('meta').set('form', '2');
    expect(formInUpdate(Y.encodeStateAsUpdate(doc))).toBe(0);
    expect(formInUpdate(new Uint8Array([1, 2, 3, 250, 251]))).toBe(0);
    expect(formInUpdate(new Uint8Array())).toBe(0);
  });

  it('is the second in this version, which has the box of rich text', () => {
    // Raised with what is added to `schema.ts` that an earlier version does not know; see ADR 0111.
    expect(FORM).toBe(2);
  });

  it('is said by the document before a box is put into one of its texts in the editor', () => {
    const doc = new Y.Doc();
    const text = doc.getXmlFragment('text');
    const changes: number[] = [];
    doc.on('update', (update: Uint8Array) => changes.push(formInUpdate(update)));
    const place = document.body.appendChild(document.createElement('div'));
    const view = new EditorView(place, {
      state: EditorState.create({
        schema: bodySchema,
        plugins: [ySyncPlugin(text), saysForm(text)],
      }),
    });
    views.push(view);
    const { paragraph, rich } = bodySchema.nodes;
    view.dispatch(view.state.tr.insertText('Plain words.', 1));
    expect(formOf(doc)).toBe(1);
    const box = rich.create(null, paragraph.create(null, bodySchema.text('In a box.')));
    view.dispatch(view.state.tr.insert(view.state.doc.content.size, box));
    expect(formOf(doc)).toBe(2);
    expect(text.toString()).toContain('<rich><paragraph');
    // The change that says the form is the first to be sent after the plain words, and the box comes after it.
    const said = changes.findIndex((form) => form === 2);
    const boxed = changes.length - 1;
    expect(said).toBeGreaterThan(-1);
    expect(said).toBeLessThan(boxed);
    // Taken out again, the document stays of the form it said.
    view.dispatch(
      view.state.tr.delete(view.state.doc.content.size - box.nodeSize, view.state.doc.content.size),
    );
    expect(formOf(doc)).toBe(2);
  });

  it('is the latest form of a project file that the core reads', () => {
    // A project file is written in the form of its texts (`projectfile.rs`).
    expect(Number(/pub const FORMAT: u32 = (\d+);/.exec(projectfile)?.[1])).toBe(FORM);
  });

  it('is asked of the blocks at the top of a text', () => {
    const { paragraph, rich } = bodySchema.nodes;
    const plain = bodySchema.node('doc', null, [paragraph.create()]);
    const boxed = bodySchema.node('doc', null, [
      paragraph.create(),
      rich.create(null, paragraph.create()),
    ]);
    expect(formOfText(plain)).toBe(1);
    expect(formOfText(boxed)).toBe(2);
    expect(formOfElements([new Y.XmlElement('paragraph')])).toBe(1);
    expect(formOfElements([new Y.XmlElement('paragraph'), new Y.XmlElement('rich')])).toBe(2);
  });
});

/**
 * Why the form is asked before a text is shown. These hold the binding to
 * what it does today; should one fail after an update of y-prosemirror, the
 * binding has changed, and ADR 0111 is to be read again.
 */
describe('what the binding does with what its schema does not know', () => {
  it('takes a block it does not know out of the document, for everyone', () => {
    const doc = new Y.Doc();
    const text = withUnknownBlock(doc);
    expect(text.length).toBe(3);
    show(text);
    expect(text.length).toBe(2);
    expect(text.toString()).not.toContain('Inside.');
    // What was taken out here is taken out where the change arrives.
    const other = new Y.Doc();
    Y.applyUpdate(other, Y.encodeStateAsUpdate(doc));
    expect(other.getXmlFragment('text').toString()).not.toContain('Inside.');
  });

  it('takes words with a mark it does not know out of the document', () => {
    const doc = new Y.Doc();
    const text = doc.getXmlFragment('text');
    const paragraph = new Y.XmlElement('paragraph');
    const words = new Y.XmlText();
    paragraph.insert(0, [words]);
    text.insert(0, [paragraph]);
    words.insert(0, 'Plain, ');
    words.insert(7, 'set by hand', { 'of-a-later-form': { size: 20 } });
    show(text);
    expect(text.toString()).not.toContain('set by hand');
  });
});
