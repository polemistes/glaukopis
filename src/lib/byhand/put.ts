/**
 * Putting a box of rich text into a text from the tools (ADR 0112). In a
 * project that is shared, the first box is asked about: an earlier version
 * of the application does not know the box, and those who have one are kept
 * out of the project from then on, until they have updated (ADR 0111).
 */

import type { EditorView } from 'prosemirror-view';
import { ySyncPluginKey } from 'y-prosemirror';
import type * as Y from 'yjs';
import { formOf, formOfText } from '$lib/editor/form';
import { hooksOf } from '$lib/editor/ui.svelte';
import { t } from '$lib/i18n';
import { confirm } from '$lib/ui/confirm.svelte';
import { BOX, insertBox } from './box';

/** The form of the texts a box needs, as `editor/form.ts` has it. */
function formOfBox(view: EditorView): number {
  const { doc, paragraph } = view.state.schema.nodes;
  const box = view.state.schema.nodes[BOX];
  return formOfText(doc.create(null, box.create(null, paragraph.create())));
}

/** Puts a box where the cursor is, asking first where the project is shared and has had none. */
export async function putBox(view: EditorView): Promise<void> {
  if (view.isDestroyed || !insertBox(view.state)) return;
  const document = (ySyncPluginKey.getState(view.state) as { doc?: Y.Doc } | undefined)?.doc;
  const first = !!document && formOf(document) < formOfBox(view);
  if (first && hooksOf.get(view)?.shared?.()) {
    const yes = await confirm({
      title: t('byhand-shared-title'),
      message: t('byhand-shared'),
      confirm: t('byhand-shared-put'),
    });
    if (!yes || view.isDestroyed) return;
  }
  insertBox(view.state, view.dispatch, view);
  view.focus();
}
