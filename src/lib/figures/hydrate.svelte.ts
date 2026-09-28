/**
 * Text that is shown and not written is made as HTML, in which a picture is
 * the name of its file, a formula what was written, and words that point
 * what they point to. Here they are given what they are shown as, when the
 * text has been put into the page and whenever it is put there anew.
 */

import type { Project } from '$lib/project/model/project.svelte';
import { refForm } from '$lib/project/model/text';
import { showFormula } from './math.svelte';
import { numbering, pointerText } from './numbering.svelte';
import { pictures } from './pictures.svelte';
import { dress } from '$lib/tables/look';
import { usualOf } from './placing';
import { figureLabel, showPlacing } from './views.svelte';

export interface Shown {
  /** What was put into the element: given anew, its content is seen to anew. */
  html: string;
  project: Project;
  /** The element whose text it is, by which what stands in it is numbered. */
  element: string;
}

function fill(root: HTMLElement, shown: Shown) {
  for (const el of root.querySelectorAll<HTMLElement>('[data-math]')) {
    showFormula(el, el.dataset.math ?? '', el.hasAttribute('data-display'));
  }
  for (const img of root.querySelectorAll<HTMLImageElement>('img[data-picture]')) {
    const [hash, extension] = (img.dataset.picture ?? '').split('.');
    const picture = pictures.of(hash, extension ?? '');
    const holder = img.parentElement;
    if (picture.url) {
      if (img.getAttribute('src') !== picture.url) img.src = picture.url;
      holder?.removeAttribute('data-state');
    } else {
      img.removeAttribute('src');
      holder?.setAttribute('data-state', picture.state);
    }
  }

  // The numbers, what the document calls things, and where they stand.
  const map = shown.project.node(shown.element)?.map;
  if (!map) return;
  const format = numbering.formatOf(shown.project, map);
  for (const [selector, kind] of [
    ['figure.figure', 'figure'],
    ['figure.tabular', 'table'],
    ['.equation', 'equation'],
  ] as const) {
    for (const el of root.querySelectorAll<HTMLElement>(selector)) {
      showPlacing(
        el,
        {
          align: el.dataset.align,
          flow: el.dataset.flow,
          width: el.dataset.width ?? el.querySelector<HTMLElement>('.picture')?.dataset.width,
        },
        usualOf(format, kind),
        kind,
      );
    }
  }
  const numbers = numbering.of(shown.project, map);
  const counting = numbering.countingOf(shown.project, map);
  const within = numbers.within.get(shown.element);
  root.querySelectorAll<HTMLElement>('figure.figure').forEach((figure, i) => {
    const said = figure.querySelector<HTMLElement>('figcaption');
    if (!said) return;
    const label = figureLabel(
      !figure.hasAttribute('data-unnumbered'),
      within?.figure[i] ?? null,
      !figure.classList.contains('uncaptioned'),
      counting,
    );
    if (label) said.dataset.label = label;
    else delete said.dataset.label;
  });
  root.querySelectorAll<HTMLElement>('figure.tabular').forEach((table, i) => {
    // Its lines, and where what is said of it stands, as the format has them.
    dress(table, format);
    const said = table.querySelector<HTMLElement>('figcaption');
    if (!said) return;
    const label = figureLabel(
      !table.hasAttribute('data-unnumbered'),
      within?.table[i] ?? null,
      !table.classList.contains('uncaptioned'),
      counting,
      'table',
    );
    if (label) said.dataset.label = label;
    else delete said.dataset.label;
  });
  root.querySelectorAll<HTMLElement>('.equation').forEach((equation, i) => {
    const number = within?.equation[i] ?? null;
    if (number && equation.hasAttribute('data-numbered'))
      equation.dataset.number = `${counting.before}${number}${counting.after}`;
    else delete equation.dataset.number;
  });
  for (const el of root.querySelectorAll<HTMLElement>('[data-crossref]')) {
    const text = pointerText(
      numbers.byId.get(el.dataset.crossref ?? ''),
      refForm(el.dataset.form),
      counting,
    );
    el.textContent = text || '?';
    el.classList.toggle('missing', !text);
  }
}

/** For an element whose content is made of `blocksHtml`. */
export function hydrate(node: HTMLElement, shown: Shown) {
  let stop = () => {};
  const begin = (now: Shown) => {
    stop();
    // What is read while filling is followed: a picture or a formula that
    // comes later is put in when it comes, and a number that changes is changed.
    stop = $effect.root(() => {
      $effect(() => fill(node, now));
    });
  };
  begin(shown);
  return {
    update: begin,
    destroy: () => stop(),
  };
}
