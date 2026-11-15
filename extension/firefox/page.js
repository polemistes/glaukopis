/**
 * What the plugin does in the page, each a function that is put into the
 * tab by `scripting.executeScript({ func })`. Firefox sends such a function
 * as its source, so each stands alone: it uses nothing outside itself but
 * the page, and what it gives back is plain data. The tests of Glaukopis
 * call them in a page of their own (`src/lib/notebook/plugin.test.ts`).
 */

/**
 * What is selected in the page: its words, a line to each block, and its
 * HTML with every link a whole address. Nothing where nothing is selected.
 * In a field of text, its words alone.
 *
 * @returns {{ url: string, title: string, text: string, html: string } | null}
 */
export function readSelection() {
  const page = { url: document.location.href, title: document.title };
  const field = document.activeElement;
  if (
    field &&
    (field.tagName === 'TEXTAREA' || field.tagName === 'INPUT') &&
    typeof field.selectionStart === 'number' &&
    field.selectionEnd > field.selectionStart
  ) {
    const text = field.value.slice(field.selectionStart, field.selectionEnd);
    return text.trim() ? { ...page, text, html: '' } : null;
  }
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
  const text = selection.toString();
  if (!text.trim()) return null;
  const holder = document.createElement('div');
  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    // Words selected within one block keep the marks they stand in.
    let within = range.commonAncestorContainer;
    if (within.nodeType !== 1) within = within.parentElement;
    const part = range.cloneContents();
    const inline = ['A', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'SUB', 'SUP', 'CODE', 'SPAN'];
    let wrapped = part;
    for (let at = within; at && inline.includes(at.tagName); at = at.parentElement) {
      const wrap = at.cloneNode(false);
      wrap.appendChild(wrapped);
      wrapped = wrap;
    }
    holder.appendChild(wrapped);
  }
  for (const gone of holder.querySelectorAll('script, style, noscript, template'))
    gone.remove();
  for (const a of holder.querySelectorAll('a[href]')) {
    try {
      a.setAttribute('href', new URL(a.getAttribute('href'), document.baseURI).href);
    } catch {
      a.removeAttribute('href');
    }
  }
  return { ...page, text, html: holder.innerHTML };
}

/**
 * The page as it reads: by Mozilla's Readability, put into the tab before
 * this, its article as HTML and as words; the words of the whole body
 * where it finds none.
 *
 * @returns {{ url: string, title: string, text: string, html: string }}
 */
export function readPage() {
  const page = { url: document.location.href, title: document.title };
  // The words of HTML, a line to each block, none empty.
  const wordsOf = (root) => {
    const blocks = new Set([
      'P', 'DIV', 'LI', 'TR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE',
      'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'DT', 'DD', 'FIGCAPTION', 'TABLE', 'UL', 'OL',
    ]);
    let out = '';
    const visit = (node) => {
      if (node.nodeType === 3) out += node.nodeValue;
      else if (node.nodeType !== 1) for (const child of node.childNodes) visit(child);
      else {
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(node.tagName)) return;
        if (node.tagName === 'BR') {
          out += '\n';
          return;
        }
        if (blocks.has(node.tagName)) out += '\n';
        for (const child of node.childNodes) visit(child);
        if (blocks.has(node.tagName)) out += '\n';
      }
    };
    visit(root);
    return out
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
  };
  let article = null;
  try {
    // eslint-disable-next-line no-undef
    if (typeof Readability === 'function') article = new Readability(document.cloneNode(true)).parse();
  } catch {
    article = null;
  }
  if (article && article.content) {
    // Read in a template, whose content is inert: nothing in it is run or loaded.
    const template = document.createElement('template');
    template.innerHTML = article.content;
    const text = wordsOf(template.content);
    if (text) return { ...page, text, html: article.content };
  }
  return { ...page, text: document.body ? wordsOf(document.body) : '', html: '' };
}

/**
 * The image the right button was pressed on: drawn on a canvas and read as
 * PNG where the page allows it; where it does not (an image from another
 * site taints the canvas), where it is shown in the window, so that it can
 * be cut out of a picture of the tab. Nothing where there is no image.
 *
 * @param {number} target the `targetElementId` of the menu's click
 */
export function readImage(target) {
  const page = { url: document.location.href, title: document.title };
  // eslint-disable-next-line no-undef
  const menus = browser.menus || browser.contextMenus;
  let element = menus.getTargetElement(target);
  if (!element) return null;
  if (element.tagName !== 'IMG' && element.tagName !== 'CANVAS' && element.querySelector)
    element = element.querySelector('img') || element;
  const box = element.getBoundingClientRect();
  const rect = { x: box.left, y: box.top, width: box.width, height: box.height };
  const view = { width: window.innerWidth, height: window.innerHeight };
  const alt = (element.getAttribute && (element.getAttribute('alt') || element.getAttribute('title'))) || '';
  const src = element.currentSrc || element.src || '';
  let png = null;
  try {
    if (element.tagName === 'CANVAS') png = element.toDataURL('image/png');
    else if (element.tagName === 'IMG' && element.complete && element.naturalWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = element.naturalWidth;
      canvas.height = element.naturalHeight;
      canvas.getContext('2d').drawImage(element, 0, 0);
      png = canvas.toDataURL('image/png');
    }
  } catch {
    // A tainted canvas will not be read: the image is cut out of the tab.
    png = null;
  }
  if (png && !png.startsWith('data:image/png')) png = null;
  return { ...page, png, alt: alt.trim(), src, rect, view };
}

/**
 * A rectangle of the page marked with the pointer, over all of it: what is
 * marked where the pointer is let go, nothing where Esc is pressed or the
 * pointer only clicked. The marking is taken away, and the page drawn
 * again without it, before the rectangle is given, so that a picture of
 * the tab taken then does not show it.
 *
 * @returns {Promise<{ url: string, title: string, rect: object, view: object } | null>}
 */
export function markRegion() {
  const page = { url: document.location.href, title: document.title };
  const MARK = 'data-glaukopis-marking';
  if (document.documentElement.hasAttribute(MARK)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const root = document.documentElement;
    root.setAttribute(MARK, '');
    const cover = document.createElement('div');
    cover.style.cssText =
      'all: initial; position: fixed; inset: 0; z-index: 2147483647; cursor: crosshair;' +
      'background: rgba(0, 0, 0, 0.12); user-select: none; touch-action: none;';
    const band = document.createElement('div');
    band.style.cssText =
      'all: initial; position: fixed; display: none; box-sizing: border-box; pointer-events: none;' +
      'border: 2px dashed #fff; outline: 1px solid rgba(0, 0, 0, 0.6);' +
      'background: rgba(255, 255, 255, 0.08);';
    cover.appendChild(band);
    let from = null;
    let rect = null;
    const between = (ax, ay, bx, by) => ({
      x: Math.min(ax, bx),
      y: Math.min(ay, by),
      width: Math.abs(bx - ax),
      height: Math.abs(by - ay),
    });
    const end = (marked) => {
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('blur', blur);
      cover.remove();
      root.removeAttribute(MARK);
      if (!marked) {
        resolve(null);
        return;
      }
      const view = { width: window.innerWidth, height: window.innerHeight };
      // Drawn again without the marking before the tab's picture is taken.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve({ ...page, rect: marked, view })),
      );
    };
    const key = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      end(null);
    };
    // The window left, as for another program: the marking is given up.
    const blur = (e) => {
      if (e.target === window) end(null);
    };
    cover.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      from = { x: e.clientX, y: e.clientY };
      cover.setPointerCapture?.(e.pointerId);
    });
    cover.addEventListener('pointermove', (e) => {
      if (!from) return;
      rect = between(from.x, from.y, e.clientX, e.clientY);
      band.style.display = 'block';
      band.style.left = `${rect.x}px`;
      band.style.top = `${rect.y}px`;
      band.style.width = `${rect.width}px`;
      band.style.height = `${rect.height}px`;
    });
    cover.addEventListener('pointerup', (e) => {
      if (!from) return;
      rect = between(from.x, from.y, e.clientX, e.clientY);
      // A click marks nothing.
      end(rect.width >= 4 && rect.height >= 4 ? rect : null);
    });
    window.addEventListener('keydown', key, true);
    window.addEventListener('blur', blur);
    (document.body || root).appendChild(cover);
  });
}
