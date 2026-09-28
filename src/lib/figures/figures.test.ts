import { EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { prosemirrorToYXmlFragment } from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import {
  insertEquation,
  insertFigure,
  insertMath,
  leaveCaption,
  widthFor,
} from '$lib/editor/commands';
import { bodySchema } from '$lib/editor/schema';
import { buildDocument } from '$lib/project/model/document';
import { blocksHtml } from '$lib/project/model/html';
import { Project } from '$lib/project/model/project.svelte';
import { bodyFacts, readBody } from '$lib/project/model/text';
import { sanitise } from './math.svelte';

const HASH = 'a'.repeat(64);
const picture = { hash: HASH, extension: 'png', name: 'vase.png', width: 480 };

let view: EditorView | undefined;

function editor(text = ''): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const { paragraph } = bodySchema.nodes;
  const doc = bodySchema.node('doc', null, [
    paragraph.create(null, text ? bodySchema.text(text) : undefined),
  ]);
  view = new EditorView(place, { state: EditorState.create({ schema: bodySchema, doc }) });
  return view;
}

const shape = (v: EditorView) => {
  const out: string[] = [];
  v.state.doc.forEach((n) =>
    out.push(n.type.name === 'paragraph' ? `p:${n.textContent}` : n.type.name),
  );
  return out.join(' ');
};

afterEach(() => {
  view?.destroy();
  view = undefined;
  document.body.innerHTML = '';
});

describe('figures and formulas in the text', () => {
  it('a formula takes what is selected, and is left selected', () => {
    const v = editor('where x_i holds');
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 7, 10)));
    expect(insertMath(v.state, v.dispatch)).toBe(true);
    const node = v.state.doc.nodeAt(7)!;
    expect(node.type.name).toBe('math');
    expect(node.attrs.tex).toBe('x_i');
    expect(v.state.selection instanceof NodeSelection).toBe(true);
    expect(v.state.doc.textContent).toBe('where  holds');
  });

  it('an equation stands after the paragraph, or in its place when that is empty', () => {
    const v = editor('Some text');
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 4)));
    expect(insertEquation(v.state, v.dispatch)).toBe(true);
    expect(shape(v)).toBe('p:Some text equation');
    expect((v.state.selection as NodeSelection).node.type.name).toBe('equation');

    const w = editor();
    insertEquation(w.state, w.dispatch);
    expect(shape(w)).toBe('equation');
    w.destroy();
  });

  it('a figure is put in with the cursor in what is said of it, and left by Enter', () => {
    const v = editor('Before');
    insertFigure(picture)(v.state, v.dispatch);
    expect(shape(v)).toBe('p:Before figure');
    expect(v.state.selection.$from.parent.type.name).toBe('figure');
    v.dispatch(v.state.tr.insertText('A vase'));
    expect(leaveCaption(v.state, v.dispatch)).toBe(true);
    expect(shape(v)).toBe('p:Before figure p:');
    expect(v.state.selection.$from.parent.type.name).toBe('paragraph');
    // A second figure, from within what is said of the first, stands after it.
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, 10)));
    expect(v.state.selection.$from.parent.type.name).toBe('figure');
    insertFigure({ ...picture, hash: 'b'.repeat(64) })(v.state, v.dispatch);
    expect(shape(v)).toBe('p:Before figure figure p:');
    // What is said of a figure holds no note.
    expect(bodySchema.nodes.figure.contentMatch.matchType(bodySchema.nodes.footnote)).toBeNull();
    expect(bodySchema.nodes.figure.contentMatch.matchType(bodySchema.nodes.math)).not.toBeNull();
  });

  it('a picture is set as wide as suits what it holds', () => {
    expect(widthFor({ ...picture, width: 480 })).toBe(50);
    expect(widthFor({ ...picture, width: 100 })).toBe(25);
    expect(widthFor({ ...picture, width: 4000 })).toBe(100);
    expect(widthFor({ ...picture, width: null })).toBe(100);
    expect(widthFor({ ...picture, extension: 'svg', width: null })).toBe(60);
  });

  it('is read from the project, shown, and part of the document', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const root = p.map(map)!.root;
    const a = p.addChild(root, { title: 'A' })!;
    const { paragraph, math, equation, figure, citation } = bodySchema.nodes;
    const doc = bodySchema.node('doc', null, [
      paragraph.create(null, [bodySchema.text('Where '), math.create({ tex: 'x_i' })]),
      equation.create({ tex: 'a = b', numbered: true }),
      equation.create({ tex: '  ' }),
      figure.create(
        { file: HASH, extension: 'png', name: 'vase.png', width: 50, alt: 'A "vase"' },
        [bodySchema.text('A vase, after '), citation.create({ items: [{ id: 'r1' }] })],
      ),
    ]);
    p.transact(() => prosemirrorToYXmlFragment(doc, p.fragment(a, 'body')!));

    const blocks = readBody(p.fragment(a, 'body')!);
    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'equation', 'figure']);
    expect(blocks[1]).toEqual({ kind: 'equation', tex: 'a = b', numbered: true });
    expect(blocks[2]).toMatchObject({
      kind: 'figure',
      file: HASH,
      extension: 'png',
      name: 'vase.png',
      alt: 'A "vase"',
      width: 50,
      numbered: true,
    });

    const facts = bodyFacts(blocks);
    expect(facts.cited).toEqual(['r1']);
    expect(facts.empty).toBe(false);
    // "Where", the formula, and what is said of the figure.
    expect(facts.words).toBe(2 + 3);
    expect(bodyFacts(readBody(undefined)).empty).toBe(true);
    expect(p.node(a)?.cited).toEqual(['r1']);

    const html = blocksHtml(blocks);
    expect(html).toContain('<span class="math" data-math="x_i">x_i</span>');
    expect(html).toContain('<div class="equation" data-numbered>');
    expect(html).toContain(`<img data-picture="${HASH}.png" alt="A &quot;vase&quot;"`);
    expect(html).toContain('style="width: 50%"');
    expect(html).toContain('<figcaption>A vase, after ');

    const sections = buildDocument(p, map).sections;
    expect(sections[0].blocks.map((b) => b.kind)).toEqual(['paragraph', 'equation', 'figure']);
  });

  it('a picture that is not named as pictures are is not asked for', () => {
    const html = blocksHtml([
      {
        kind: 'figure',
        file: '../../etc/passwd',
        extension: 'png',
        name: '',
        caption: [],
        alt: '',
        width: 400,
        numbered: false,
      },
    ]);
    expect(html).not.toContain('<img');
    expect(html).toContain('data-unnumbered');
    expect(html).toContain('width: 100%');
  });

  it('a picture is put at the end of an element it is dropped on', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const a = p.addChild(p.map(map)!.root, { title: 'A', body: 'Text.' })!;
    p.checkpoint();
    p.addFigure(a, picture, 50);
    p.checkpoint();
    const blocks = readBody(p.fragment(a, 'body')!);
    expect(blocks.map((b) => b.kind)).toEqual(['paragraph', 'figure']);
    expect(blocks[1]).toMatchObject({ file: HASH, width: 50, numbered: true, caption: [] });
    p.undo();
    expect(readBody(p.fragment(a, 'body')!).map((b) => b.kind)).toEqual(['paragraph']);
  });
});

describe('mathematics as it is shown', () => {
  it('is mathematics, and nothing else', () => {
    const clean = sanitise(
      '<math display="block" xmlns="http://www.w3.org/1998/Math/MathML" onclick="alert(1)"><semantics><mrow>' +
        '<msup><mi>a</mi><mn>2</mn></msup><mo stretchy="false" onmouseover="x()">(</mo>' +
        '<mtext mathvariant="normal">&lt;b&gt;</mtext><script>alert(1)</script>' +
        '<a href="javascript:alert(1)"><mi>x</mi></a><mi href="javascript:alert(1)" style="color:red">y</mi>' +
        '</mrow><annotation encoding="application/x-tex">a^2</annotation></semantics></math>',
    )!;
    expect(clean).toContain('<msup><mi>a</mi><mn>2</mn></msup>');
    expect(clean).toContain('display="block"');
    expect(clean).toContain('<mo stretchy="false">(</mo>');
    expect(clean).toContain('&lt;b&gt;');
    expect(clean).not.toMatch(/script|onclick|onmouseover|href|style|annotation|alert|<a\b/);
    expect(clean).toContain('<mi>y</mi>');
    expect(sanitise('<p>no mathematics</p>')).toBeNull();
  });
});
