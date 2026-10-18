import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { passageGone } from './marks';

/** A text of two paragraphs in a shared document, and a passage on the first, as an editor would keep it. */
function text() {
  const doc = new Y.Doc();
  const body = doc.getXmlFragment('body');
  const first = new Y.XmlElement('paragraph');
  const second = new Y.XmlElement('paragraph');
  body.insert(0, [first, second]);
  const words = new Y.XmlText('We sailed into the harbour of Piraeus at dawn.');
  first.insert(0, [words]);
  second.insert(0, [new Y.XmlText('Then we went ashore.')]);
  const rel = (type: Y.XmlText, index: number) =>
    Y.encodeRelativePosition(Y.createRelativePositionFromTypeIndex(type, index));
  const start = 'We sailed into '.length;
  const end = start + 'the harbour of Piraeus'.length;
  const passage = { from: rel(words, start), to: rel(words, end), text: 'the harbour of Piraeus' };
  return { doc, body, words, passage, start, end };
}

describe('a passage commented on', () => {
  it('stands while its text is there, changed or not', () => {
    const { doc, words, passage, start } = text();
    expect(passageGone(doc, passage)).toBe(false);
    words.insert(start + 4, 'old ');
    words.delete(0, 3);
    expect(passageGone(doc, passage)).toBe(false);
  });

  it('is gone when its text is deleted, or cut to be pasted elsewhere', () => {
    const { doc, words, passage, start, end } = text();
    words.delete(start, end - start);
    expect(passageGone(doc, passage)).toBe(true);
  });

  it('is gone when its paragraph is deleted', () => {
    const { doc, body, passage } = text();
    body.delete(0, 1);
    expect(passageGone(doc, passage)).toBe(true);
  });

  it('is gone when its positions cannot be read', () => {
    const { doc, passage } = text();
    expect(passageGone(doc, { ...passage, from: new Uint8Array([1, 2]) })).toBe(true);
    expect(passageGone(new Y.Doc(), passage)).toBe(true);
  });
});
