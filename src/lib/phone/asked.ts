/**
 * What the Android part of the app asked of the page (stage 3 of
 * `docs/plans/an-app-for-android.md`): that the note made of what another
 * app shared is shown, and that a new note is made, as the icon's *New note*
 * asks for. The Android part keeps what it was started or brought to the
 * front for until the page asks (`window.glaukopisAndroid.asked()`), and
 * sends the event `glaukopis-asked` to the window where the page runs while
 * it is asked. On a phone nothing but the Android part writes into the
 * inbox, so this is also how the page is told that something came into it:
 * no thread looks at the inbox, and nothing is asked at regular times.
 */

import type { Notebook } from '$lib/notebook/model/notebook.svelte';
import { theNotebook } from '$lib/notebook/open.svelte';
import { noteOfThing, takeInbox } from './inbox';
import { places } from './places.svelte';

/** What was asked: the names of the things in the inbox that another app shared, and whether a new note is asked for. */
export interface Asked {
  arrived: string[];
  note: boolean;
}

/**
 * What the Android part said, read with care: a string of JSON, or the
 * thing itself. Anything else is nothing asked.
 */
export function readAsked(said: unknown): Asked {
  let thing = said;
  if (typeof said === 'string') {
    try {
      thing = JSON.parse(said);
    } catch {
      return { arrived: [], note: false };
    }
  }
  if (!thing || typeof thing !== 'object' || Array.isArray(thing))
    return { arrived: [], note: false };
  const { arrived, note } = thing as { arrived?: unknown; note?: unknown };
  return {
    arrived: Array.isArray(arrived)
      ? arrived.filter((name): name is string => typeof name === 'string')
      : [],
    note: note === true,
  };
}

/** A new note, in the box that receives and with no tag, and the place for it: the writer opened the app by its icon, so Back from it is the notes. */
async function makeNote() {
  let notebook: Notebook;
  try {
    notebook = await theNotebook.open();
  } catch (error) {
    console.warn('A new note was asked for, and the notebook could not be read', error);
    return;
  }
  notebook.checkpoint();
  const note = notebook.addNote({ box: notebook.receiving });
  notebook.checkpoint();
  places.arrive({ at: 'note', note, fresh: true }, false);
}

/**
 * The note of what another app shared, shown: the last of the things
 * arrived of which a note was made in this run, where that note is there.
 * Not `fresh`: the keyboard does not come up over what was shared until the
 * writer presses where they want to write. Where no note was made, the
 * notebook could not be read and the thing waits, or the thing held nothing:
 * the app stays where it was.
 */
function showArrived(arrived: string[]) {
  const made = arrived.map(noteOfThing).filter((note) => note !== undefined);
  const note = made.at(-1);
  if (note !== undefined && theNotebook.current?.note(note)) places.arrive({ at: 'note', note });
}

async function answerNow(asked: Asked) {
  try {
    // Whatever was asked, what lies in the inbox is taken in first.
    await takeInbox();
    if (asked.note) await makeNote();
    if (asked.arrived.length) showArrived(asked.arrived);
  } catch (error) {
    console.warn('What the app was asked for could not be done', error);
  }
}

let answering: Promise<void> = Promise.resolve();

/** Answers what was asked, one at a time: what is asked while another is answered is answered after it. */
export function answer(asked: Asked): Promise<void> {
  const done = answering.then(() => answerNow(asked));
  answering = done;
  return done;
}

/**
 * Asks the Android part what the app was started or brought to the front
 * for, and answers it. Where there is no Android part, as on a computer,
 * nothing was asked, and the inbox is taken in all the same.
 */
export function takeAsked(): Promise<void> {
  let said: unknown;
  try {
    said = window.glaukopisAndroid?.asked?.();
  } catch (error) {
    console.warn('The Android part was not asked what the app was started for', error);
  }
  return answer(readAsked(said));
}

/** Listens to what the Android part says is asked while the page runs; gives what ends the listening. */
export function followAsked(): () => void {
  const asked = () => void takeAsked();
  window.addEventListener('glaukopis-asked', asked);
  return () => window.removeEventListener('glaukopis-asked', asked);
}
