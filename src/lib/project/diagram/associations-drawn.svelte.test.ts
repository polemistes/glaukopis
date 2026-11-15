import { afterEach, describe, expect, it, vi } from 'vitest';

// The drawings are mounted and clicked, so with the browser's Svelte: the
// tests otherwise run with the server's.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../../node_modules/svelte/src/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
const { default: AssociationCurves } = await import('./AssociationCurves.svelte');
const { default: AssociationLabels } = await import('./AssociationLabels.svelte');
const { associationDrawn } = await import('./lines');

const SVG = 'http://www.w3.org/2000/svg';
const a = { id: 'a', x: 0, y: 0, w: 100, h: 30 };
const b = { id: 'b', x: 300, y: 100, w: 100, h: 30 };
const c = { id: 'c', x: -200, y: 200, w: 100, h: 30 };
const drawn = [
  associationDrawn({ id: 'l1', from: 'a', to: 'b', label: 'kills', arrow: 'both' }, a, b),
  associationDrawn({ id: 'l2', from: 'a', to: 'gone', label: '', colour: 'teal' }, a, c),
];

let done = () => {};
afterEach(() => {
  done();
  done = () => {};
  document.body.innerHTML = '';
});

describe('the curves of associations', () => {
  it('are drawn in the svg they are put in, as the picture of a diagram reads them', () => {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'lines');
    document.body.append(svg);
    const chosen: string[] = [];
    const written: string[] = [];
    const shown = mount(AssociationCurves, {
      target: svg,
      props: {
        associations: drawn,
        selected: 'l1',
        pending: 'M 0 0 L 10 10',
        onselect: (id: string) => chosen.push(id),
        onwrite: (id: string) => written.push(id),
      },
    });
    done = () => unmount(shown);
    flushSync();

    const groups = svg.querySelectorAll(':scope > g.association');
    expect(groups).toHaveLength(2);
    expect(groups[0].namespaceURI).toBe(SVG);
    expect(groups[0].getAttribute('data-link')).toBe('l1');
    expect(groups[0].classList.contains('selected')).toBe(true);
    expect(groups[1].classList.contains('faint')).toBe(true);
    expect(svg.querySelectorAll('g.association path.curve')).toHaveLength(2);
    expect(svg.querySelectorAll('g.association path.link-hit')).toHaveLength(2);
    expect(svg.querySelectorAll('g.association[data-link="l1"] path.head')).toHaveLength(2);
    expect(svg.querySelector('path.curve')!.namespaceURI).toBe(SVG);
    expect(svg.querySelector(':scope > path.curve.pending')?.getAttribute('d')).toBe(
      'M 0 0 L 10 10',
    );
    expect((groups[1] as SVGGElement).style.getPropertyValue('--link')).not.toBe('');

    groups[1].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    groups[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(chosen).toEqual(['l2']);
    expect(written).toEqual(['l1']);
  });
});

describe('the words of associations', () => {
  it('stand as children of what they are put in, and the field of the words being written', () => {
    const world = document.createElement('div');
    world.className = 'world';
    document.body.append(world);
    const props = $state({
      associations: drawn,
      selected: null as string | null,
      writing: null as string | null,
    });
    const chosen: string[] = [];
    const shown = mount(AssociationLabels, {
      target: world,
      props: {
        get associations() {
          return props.associations;
        },
        get selected() {
          return props.selected;
        },
        get writing() {
          return props.writing;
        },
        onselect: (id: string) => chosen.push(id),
        onwrite: () => {},
        ondone: () => {},
        oncancel: () => {},
      },
    });
    done = () => unmount(shown);
    flushSync();

    // Only an association with words has them shown.
    const labels = world.querySelectorAll(':scope > .link-label');
    expect(labels).toHaveLength(1);
    expect(labels[0].textContent).toBe('kills');
    expect(labels[0].getAttribute('data-link')).toBe('l1');
    labels[0].dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(chosen).toEqual(['l1']);

    props.selected = 'l1';
    flushSync();
    expect(world.querySelector('.link-label')!.classList.contains('selected')).toBe(true);

    props.writing = 'l2';
    flushSync();
    expect(world.querySelectorAll(':scope > .link-field')).toHaveLength(1);
    expect(world.querySelectorAll(':scope > .link-label')).toHaveLength(1);
  });
});
