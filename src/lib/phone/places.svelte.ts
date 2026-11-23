/**
 * The phone's three places, and their steps (stage 2 of
 * `docs/plans/an-app-for-android.md`, part C). A stand-in of the meeting
 * points, with the shape the other parts use; part C fills it in.
 */

export type Place =
  { at: 'notes' } | { at: 'note'; note: string; fresh?: boolean } | { at: 'settings' };

class Places {
  /** The place shown. */
  current = $state<Place>({ at: 'notes' });

  /** Begins: the notes, and Back listened to. */
  begin(): void {}

  /** Goes to a place, a step that Back takes back. */
  go(place: Place): void {
    this.current = place;
  }

  /** Back: closes what lies over the place, or goes to the place before; at the notes, leaves the app. */
  back(): void {
    this.current = { at: 'notes' };
  }

  /** Makes a step of something that lies over a place; gives back what it calls when it has closed. */
  step(close: () => void): () => void {
    void close;
    return () => {};
  }
}

export const places = new Places();
