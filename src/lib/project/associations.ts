/**
 * The menu of an association, one and the same in the diagram and in the
 * margin of the text (record 0093): its words, its arrow, its colour, and
 * taking it away. The margin puts the two ends to go to before it. It asks
 * what it needs of whatever holds the links (`LinkHolder`): a project
 * answers through `linkHolderOf`, and so can the notebook.
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
import { Project } from './model/project.svelte';
import type { LinkArrow, LinkRecord } from './model/types';

type Icon = Component<{ size?: number | string }>;

/** What the view that opens the menu does itself. */
export interface AssociationActions {
  /** Opens the field the words are written in. */
  write(): void;
  /** Goes to an end in the text: given where there is a text to go through. */
  goTo?(id: string): void;
}

/** What the menu of an association asks of whatever holds the links, and nothing more. */
export interface LinkHolder {
  /** The name of an end, by its id; empty where it has none. */
  nameOf(id: string): string;
  setArrow(link: string, arrow: LinkArrow | null): void;
  setColour(link: string, colour: string | null): void;
  remove(link: string): void;
  /** Makes a change that one undo takes back. */
  change(act: () => void): void;
}

const linkHolders = new WeakMap<Project, LinkHolder>();

/** The project as what holds its associations: one for each project, the same whenever it is asked for. */
export function linkHolderOf(project: Project): LinkHolder {
  let holder = linkHolders.get(project);
  if (!holder) {
    holder = {
      nameOf: (id) => project.node(id)?.title ?? '',
      setArrow: (link, arrow) => project.setLinkArrow(link, arrow),
      setColour: (link, colour) => project.setLinkColour(link, colour),
      remove: (link) => project.removeLink(link),
      change(act) {
        project.checkpoint();
        act();
        project.checkpoint();
      },
    };
    linkHolders.set(project, holder);
  }
  return holder;
}

/**
 * The menu of an association, of what holds it; a project given is taken
 * as its holder.
 */
export function associationMenu(
  of: LinkHolder | Project,
  link: LinkRecord,
  actions: AssociationActions,
): MenuItem[] {
  const holder = of instanceof Project ? linkHolderOf(of) : of;
  /** The name of an end as a menu says it. */
  const nameOf = (id: string) => truncate(holder.nameOf(id) || t('project-untitled'), 36);
  const items: MenuItem[] = [];
  if (actions.goTo) {
    const goTo = actions.goTo;
    for (const id of [link.from, link.to])
      items.push({
        label: t('text-go-to', { name: nameOf(id) }),
        icon: ArrowRight,
        action: () => goTo(id),
      });
    items.push({ kind: 'separator' });
  }

  const arrow = (value: LinkArrow | null, label: string, icon: Icon): MenuItem => ({
    label,
    icon,
    checked: (link.arrow ?? null) === value,
    action: () => holder.change(() => holder.setArrow(link.id, value)),
  });
  const colour = (value: string | null, label: string, ink: string): MenuItem => ({
    label,
    colour: ink,
    checked: (link.colour ?? null) === value,
    action: () => holder.change(() => holder.setColour(link.id, value)),
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
        arrow('to', t('project-link-arrow-to', { name: nameOf(link.to) }), ArrowRight),
        arrow('from', t('project-link-arrow-to', { name: nameOf(link.from) }), ArrowLeft),
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
      action: () => holder.change(() => holder.remove(link.id)),
    },
  );
  return items;
}
