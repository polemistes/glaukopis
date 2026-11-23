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
}

interface Window {
  glaukopisAndroid?: GlaukopisAndroid;
}
