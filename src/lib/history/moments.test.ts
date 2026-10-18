import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { attributesAt, NOW } from './moments';

describe('the attributes of an element at a moment', () => {
  it('come in the same order on every copy, whatever order the copy received them in', () => {
    const base = new Y.Doc();
    base.getXmlFragment('body').insert(0, [new Y.XmlElement('figure')]);
    const start = Y.encodeStateAsUpdate(base);
    // Two people set an attribute each, at different times.
    const one = new Y.Doc();
    Y.applyUpdate(one, start);
    (one.getXmlFragment('body').get(0) as Y.XmlElement).setAttribute('width', 'half');
    const two = new Y.Doc();
    Y.applyUpdate(two, start);
    (two.getXmlFragment('body').get(0) as Y.XmlElement).setAttribute('caption', 'Troy');
    const first = Y.encodeStateAsUpdate(one, Y.encodeStateVector(base));
    const second = Y.encodeStateAsUpdate(two, Y.encodeStateVector(base));
    const here = new Y.Doc();
    Y.applyUpdate(here, start);
    Y.applyUpdate(here, first);
    Y.applyUpdate(here, second);
    const there = new Y.Doc();
    Y.applyUpdate(there, start);
    Y.applyUpdate(there, second);
    Y.applyUpdate(there, first);
    const of = (doc: Y.Doc) =>
      JSON.stringify(attributesAt(doc.getXmlFragment('body').get(0) as Y.XmlElement, NOW));
    expect(of(here)).toBe(of(there));
    expect(of(here)).toBe('{"caption":"Troy","width":"half"}');
  });
});
