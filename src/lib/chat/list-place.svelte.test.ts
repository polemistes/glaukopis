import { describe, expect, it } from 'vitest';
import { ListPlace } from './list-place.svelte';

/** A rectangle from a top to a bottom, as an element says where it stands. */
const rect = (top: number, bottom: number) =>
  ({ top, bottom, left: 0, right: 100, width: 100, height: bottom - top }) as DOMRect;

/** A list that shows from 0 to 100, with new messages standing where they are told to. */
function listOf(messages: Record<string, [number, number]>) {
  const list = document.createElement('div');
  list.getBoundingClientRect = () => rect(0, 100);
  for (const [id, [top, bottom]] of Object.entries(messages)) {
    const message = document.createElement('div');
    message.dataset.chatMessage = id;
    message.dataset.chatNew = 'true';
    message.getBoundingClientRect = () => rect(top, bottom);
    list.append(message);
  }
  const place = new ListPlace();
  place.list = list;
  return place;
}

describe('where the list of the chat stands', () => {
  it('counts the new messages that have not been within what is shown, and finds the nearest', () => {
    const place = listOf({ shown: [10, 30], above: [-80, -60], below: [300, 320] });
    place.look();
    expect(place.unseen).toBe(2);
    expect(place.toNearest).toEqual({ id: 'above', up: true });
  });

  it('marks a new message until it has been seen and others have arrived after it', () => {
    const place = listOf({ shown: [10, 30], below: [300, 320] });
    place.freshChanged(new Set(['shown', 'below']));
    place.look();
    expect(place.marks('shown')).toBe(true);
    expect(place.marks('below')).toBe(true);

    // Another arrives: what was seen before it is marked no more, what was not seen still is.
    place.freshChanged(new Set(['shown', 'below', 'later']));
    expect(place.marks('shown')).toBe(false);
    expect(place.marks('below')).toBe(true);
    expect(place.marks('later')).toBe(true);
  });

  it('forgets what was seen and settled once nothing is new', () => {
    const place = listOf({ shown: [10, 30] });
    place.freshChanged(new Set(['shown']));
    place.look();
    place.freshChanged(new Set(['shown', 'later']));
    expect(place.marks('shown')).toBe(false);
    place.freshChanged(new Set());
    expect(place.marks('shown')).toBe(true);
  });
});
