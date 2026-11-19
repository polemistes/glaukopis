/**
 * Whether Rich text is offered: in the Insert menu of a text, and in the row
 * of the window of a note. It is not, yet, for two reasons.
 *
 * The owner chose (2026-11-19, in the brief; record 0111) that the guard
 * against older versions goes out a release ahead of the box. A version
 * built with this false is that release, and more: it knows the box, shows
 * one that it is given, keeps it and writes in it, and is not kept out of a
 * project when someone with a later version puts one in. It only offers no
 * way of making one. And nothing is set by hand in a box yet (the plan's
 * stages 3 to 5, `docs/plans/a-box-of-rich-text.md`): a white sheet that
 * does nothing is not to be offered.
 *
 * All of it is kept and tested: under the scripts that drive the running
 * application it is offered, whatever this says. To offer it, set this to
 * true, and bring into the guide what the plan keeps for it.
 *
 * A package for the owner to try it in is built with it offered, and
 * nothing here changed: `VITE_GLAUKOPIS_RICH_TEXT=1` when the interface is
 * built, which the Arch recipe sets where it is run with
 * `GLAUKOPIS_OFFER_RICH_TEXT=1` (`packaging/arch/PKGBUILD`).
 */
import { testing } from '$lib/shell/testing';

export const RICH_TEXT_OFFERED: boolean = import.meta.env.VITE_GLAUKOPIS_RICH_TEXT === '1';

/** Whether the tools offer Rich text in this window. */
export const richTextOffered: boolean = RICH_TEXT_OFFERED || testing;
