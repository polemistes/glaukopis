/**
 * What the Android part of the app gives the phone's page (`MainActivity`),
 * on Android only: the ground behind the system's bars, and leaving the app
 * as the system's Back does where nobody listens, with its process kept.
 */
interface GlaukopisAndroid {
  /** The ground behind the system's bars, `#rrggbb`, and whether it is dark. */
  ground(colour: string, dark: boolean): void;
  /** Puts the app behind the others. */
  leave(): void;
  /**
   * What the app was started or brought to the front for since it was last
   * asked, as JSON: `{"arrived": ["<the name of a thing in the inbox>"],
   * "note": true}`, each told once, either left out where there is none.
   * The event `glaukopis-asked` is sent to `window` when something was asked
   * while the page runs.
   */
  asked(): string;
  /** Says that the photograph the camera left for the page has been taken in, so that its file is removed. */
  photographed(): void;
  /** Brings the keyboard up for what has the cursor: Android does so by itself only after a touch. */
  keyboard?(): void;
}

interface Window {
  glaukopisAndroid?: GlaukopisAndroid;
}
