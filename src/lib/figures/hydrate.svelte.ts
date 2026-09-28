/**
 * Text that is shown and not written is made as HTML, in which a picture is
 * the name of its file and a formula what was written. Here they are given
 * what they are shown as, when the text has been put into the page and
 * whenever it is put there anew.
 */

import { showFormula } from './math.svelte';
import { pictures } from './pictures.svelte';

function fill(root: HTMLElement) {
  for (const el of root.querySelectorAll<HTMLElement>('[data-math]')) {
    showFormula(el, el.dataset.math ?? '', el.hasAttribute('data-display'));
  }
  for (const img of root.querySelectorAll<HTMLImageElement>('img[data-picture]')) {
    const [hash, extension] = (img.dataset.picture ?? '').split('.');
    const shown = pictures.of(hash, extension ?? '');
    const holder = img.parentElement;
    if (shown.url) {
      if (img.getAttribute('src') !== shown.url) img.src = shown.url;
      holder?.removeAttribute('data-state');
    } else {
      img.removeAttribute('src');
      holder?.setAttribute('data-state', shown.state);
    }
  }
}

/**
 * For an element whose content is made of `blocksHtml`. `html` is what was
 * put into it: given anew, the content is seen to anew.
 */
export function hydrate(node: HTMLElement, html: string) {
  let stop = () => {};
  const begin = (content: string) => {
    stop();
    void content;
    // What is read while filling is followed: a picture or a formula that
    // comes later is put in when it comes.
    stop = $effect.root(() => {
      $effect(() => fill(node));
    });
  };
  begin(html);
  return {
    update: begin,
    destroy: () => stop(),
  };
}
