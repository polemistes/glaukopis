/**
 * What floats over the rest: menus, popovers, tooltips, messages.
 *
 * A dialog is shown in the top layer of the window, over everything that is
 * merely high in the order of the page, and what is outside it cannot be
 * clicked while it is open. What floats is therefore put into the dialog that
 * is open, if one is, and shown in the top layer itself, where what comes
 * later lies over what came before.
 */

const dialogs: HTMLDialogElement[] = [];

function forget(dialog: HTMLDialogElement) {
  const at = dialogs.indexOf(dialog);
  if (at >= 0) dialogs.splice(at, 1);
}

export function dialogOpened(dialog: HTMLDialogElement) {
  forget(dialog);
  dialogs.push(dialog);
}

/**
 * What floats and is shown within a dialog that closes, or goes, would go
 * with it. What is to outlive it (`data-outlives-dialog`: the messages, which
 * may have come while it was open) is put where what floats is put now, and
 * stays shown; menus and tooltips of the dialog go with it, as they should.
 */
export function dialogClosed(dialog: HTMLDialogElement) {
  forget(dialog);
  for (const node of Array.from(
    dialog.querySelectorAll<HTMLElement>(':scope > [data-outlives-dialog]'),
  )) {
    // A dialog that is taken away has hidden what it held already: what has
    // anything in it is shown again where it is put, the rest only put there.
    if (node.children.length) raise(node);
    else document.body.appendChild(node);
  }
}

/** The dialog that lies over the others, or the page when none is open. */
export function topHost(): HTMLElement {
  for (let i = dialogs.length - 1; i >= 0; i--) {
    if (dialogs[i].isConnected && dialogs[i].open) return dialogs[i];
  }
  return document.body;
}

export function raise(node: HTMLElement) {
  const host = topHost();
  if (node.parentElement !== host) host.appendChild(node);
  node.setAttribute('popover', 'manual');
  node.classList.add('on-top');
  try {
    // Shown anew, it lies over what was shown before it.
    if (node.matches(':popover-open')) node.hidePopover();
    node.showPopover();
  } catch {
    // Without the top layer it is where it was, high in the order of the page.
  }
}

export function lower(node: HTMLElement) {
  try {
    if (node.matches(':popover-open')) node.hidePopover();
  } catch {
    // It was not shown.
  }
}

/**
 * `use:onTop` on what floats. The element must be the only one of its block,
 * or lie within one that stays where it is: it is moved, and what removes
 * the block looks for its parts where it put them.
 */
export function onTop(node: HTMLElement) {
  raise(node);
  return {
    destroy() {
      lower(node);
      node.remove();
    },
  };
}
