/**
 * The phone's three places, and their steps (stage 2 of
 * `docs/plans/an-app-for-android.md`, part C): the notes, a note, the
 * settings. The steps are a list kept here: the places gone to, and over
 * them what lies over a place (a sheet, a question). Android's Back, which
 * Tauri tells the page as the event `back-button`, takes the last step
 * away: it closes what lies over the place, or goes to the place before;
 * at the notes with nothing over them it puts the app behind the others.
 * The web view's history is not used: on Android it does not count, and
 * Back with it left the app (the trial of 2026-11-23). Every change happens
 * at once. The place is not kept from one start to the next.
 */

import { onBackButtonPress } from '@tauri-apps/api/app';
import { inTauri } from '$lib/api/backend';
import { over } from '$lib/ui/over';

export type Place =
  { at: 'notes' } | { at: 'note'; note: string; fresh?: boolean } | { at: 'settings' };

/** A step: a place gone to, or something that lies over a place, with what closes it. */
type Step = { place: Place } | { close: () => void };

const NOTES: Place = { at: 'notes' };

/** Whether two places are the same: the same note, or the same of the others. */
function samePlace(a: Place, b: Place): boolean {
  return a.at === b.at && (a.at !== 'note' || (b.at === 'note' && a.note === b.note));
}

/** Whether the page is on Android, where Back is the system's and the app can be put behind. */
function onAndroid(): boolean {
  return (
    typeof window !== 'undefined' &&
    (!!window.glaukopisAndroid || /\bAndroid\b/i.test(navigator.userAgent))
  );
}

class Places {
  /** The place shown. */
  current = $state.raw<Place>(NOTES);

  #steps: Step[] = [{ place: NOTES }];
  #listening = false;

  /** Begins: the notes, Back listened to on Android, and dialogs told to make steps. */
  begin(): void {
    this.#steps = [{ place: NOTES }];
    this.#shown();
    over.opened = (close) => this.step(close);
    if (this.#listening || !inTauri || !onAndroid()) return;
    this.#listening = true;
    onBackButtonPress(() => this.back()).catch((error) => {
      this.#listening = false;
      console.warn("Android's Back is not heard by the page", error);
    });
  }

  /** Goes to a place, a step that Back takes back; none where it is the place shown, pressed twice. */
  go(place: Place): void {
    const last = this.#steps[this.#steps.length - 1];
    if (last && 'place' in last && samePlace(last.place, place)) return;
    this.#steps.push({ place });
    this.#shown();
  }

  /** Back: closes what lies over the place, or goes to the place before; at the notes, leaves the app. */
  back(): void {
    const last = this.#steps[this.#steps.length - 1];
    if (last && 'close' in last) {
      // Taken out first: what it closes then finds its step gone already.
      this.#steps.pop();
      last.close();
      return;
    }
    if (this.#steps.length > 1) {
      this.#steps.pop();
      this.#shown();
      return;
    }
    window.glaukopisAndroid?.leave();
  }

  /** Makes a step of something that lies over a place; gives back what it calls when it has closed. */
  step(close: () => void): () => void {
    const step: Step = { close };
    this.#steps.push(step);
    return () => {
      const at = this.#steps.indexOf(step);
      if (at >= 0) this.#steps.splice(at, 1);
    };
  }

  /** How many steps there are: the places gone to and what lies over them (for the tests). */
  get depth(): number {
    return this.#steps.length;
  }

  /** The place of the last step that is a place. */
  #shown() {
    for (let i = this.#steps.length - 1; i >= 0; i--) {
      const step = this.#steps[i];
      if ('place' in step) {
        if (step.place !== this.current) this.current = step.place;
        return;
      }
    }
    this.#steps = [{ place: NOTES }];
    this.current = NOTES;
  }
}

export const places = new Places();
