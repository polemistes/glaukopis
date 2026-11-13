/**
 * The menu of an association, one and the same in the diagram and in the
 * margin of the text (record 0093): its words, its arrow, its colour, and
 * taking it away. The margin puts the two ends to go to before it.
 */

import ArrowLeft from '@lucide/svelte/icons/arrow-left';
import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
import ArrowRight from '@lucide/svelte/icons/arrow-right';
import Minus from '@lucide/svelte/icons/minus';
import MoveRight from '@lucide/svelte/icons/move-right';
import Palette from '@lucide/svelte/icons/palette';
import Pencil from '@lucide/svelte/icons/pencil';
import Trash2 from '@lucide/svelte/icons/trash-2';
import { t } from '$lib/i18n';
import { truncate } from '$lib/library/format';
import type { MenuItem } from '$lib/ui/menu.svelte';
import type { Component } from 'svelte';
import { KIND_COLOURS } from './kinds';
import type { Project } from './model/project.svelte';
import type { LinkArrow, LinkRecord } from './model/types';

type Icon = Component<{ size?: number | string }>;

/** What the view that opens the menu does itself. */
export interface AssociationActions {
  /** Opens the field the words are written in. */
  write(): void;
  /** Goes to an end in the text: given where there is a text to go through. */
  goTo?(id: string): void;
}

/** The name of an element as a menu says it. */
function nameOf(project: Project, id: string): string {
  return truncate(project.node(id)?.title || t('project-untitled'), 36);
}

/** A change of the association, taken back by one undo. */
function change(project: Project, act: () => void) {
  project.checkpoint();
  act();
  project.checkpoint();
}

export function associationMenu(
  project: Project,
  link: LinkRecord,
  actions: AssociationActions,
): MenuItem[] {
  const items: MenuItem[] = [];
  if (actions.goTo) {
    const goTo = actions.goTo;
    for (const id of [link.from, link.to])
      items.push({
        label: t('text-go-to', { name: nameOf(project, id) }),
        icon: ArrowRight,
        action: () => goTo(id),
      });
    items.push({ kind: 'separator' });
  }

  const arrow = (value: LinkArrow | null, label: string, icon: Icon): MenuItem => ({
    label,
    icon,
    checked: (link.arrow ?? null) === value,
    action: () => change(project, () => project.setLinkArrow(link.id, value)),
  });
  const colour = (value: string | null, label: string, ink: string): MenuItem => ({
    label,
    colour: ink,
    checked: (link.colour ?? null) === value,
    action: () => change(project, () => project.setLinkColour(link.id, value)),
  });

  items.push(
    {
      label: link.label ? t('text-change-label') : t('text-add-label'),
      icon: Pencil,
      action: actions.write,
    },
    {
      kind: 'submenu',
      label: t('project-link-arrow'),
      icon: MoveRight,
      items: [
        arrow(null, t('project-link-arrow-none'), Minus),
        arrow('to', t('project-link-arrow-to', { name: nameOf(project, link.to) }), ArrowRight),
        arrow('from', t('project-link-arrow-to', { name: nameOf(project, link.from) }), ArrowLeft),
        arrow('both', t('project-link-arrow-both'), ArrowLeftRight),
      ],
    },
    {
      kind: 'submenu',
      label: t('project-link-colour'),
      icon: Palette,
      items: [
        colour(null, t('project-link-colour-none'), 'var(--gold)'),
        ...KIND_COLOURS.map((c) => colour(c.name, t(`kinds-colour-${c.name}`), c.ink)),
      ],
    },
    { kind: 'separator' },
    {
      label: t('text-remove-association'),
      icon: Trash2,
      danger: true,
      action: () => change(project, () => project.removeLink(link.id)),
    },
  );
  return items;
}
