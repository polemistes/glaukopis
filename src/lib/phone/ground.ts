/**
 * The ground of the phone's page, as Android is told it so that it stands
 * behind the system's bars (`window.glaukopisAndroid.ground`): the colour
 * the browser works out for the page, as `#rrggbb`.
 */

/** A colour as the browser gives it (`rgb(…)`, `rgba(…)` or `#…`), as `#rrggbb`; none where it is clear or not read. */
export function hexOfColour(colour: string): string | null {
  const value = colour.trim().toLowerCase();
  const long = /^#([0-9a-f]{6})$/.exec(value);
  if (long) return `#${long[1]}`;
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(value);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(
    value,
  );
  if (!rgb) return null;
  if (rgb[4] !== undefined && parseFloat(rgb[4]) === 0) return null;
  const part = (n: string) =>
    Math.max(0, Math.min(255, Math.round(parseFloat(n))))
      .toString(16)
      .padStart(2, '0');
  return `#${part(rgb[1])}${part(rgb[2])}${part(rgb[3])}`;
}

/** The ground of the page: that of its body, else the paper of the root. */
export function groundOf(): string | null {
  const body = hexOfColour(getComputedStyle(document.body).backgroundColor);
  if (body) return body;
  return hexOfColour(getComputedStyle(document.documentElement).getPropertyValue('--paper'));
}
