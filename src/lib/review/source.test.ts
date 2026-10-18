import { describe, expect, it } from 'vitest';
import { sameChoice, type Choice } from './source';

/** A moment as the history answers it: a fresh array at every asking. */
function moment(time: number) {
  return { snapshot: new Uint8Array([1, 2, time % 256]), time };
}

describe('the moment chosen to review from', () => {
  it('is known again among the choices asked for anew', () => {
    const chosen: Choice = { kind: 'session', moment: moment(200), by: ['anna'] };
    const asked: Choice[] = [
      { kind: 'beginning', moment: moment(100) },
      { kind: 'session', moment: moment(200), by: ['anna'] },
      { kind: 'named', id: 'n1', name: 'Draft', moment: moment(300) },
    ];
    expect(asked.map((c) => sameChoice(chosen, c))).toEqual([false, true, false]);
  });

  it('a named moment is known by what it is, though another stands at the same time', () => {
    const chosen: Choice = { kind: 'named', id: 'n2', name: 'Sent', moment: moment(300) };
    expect(sameChoice(chosen, { kind: 'named', id: 'n2', name: 'Sent', moment: moment(300) })).toBe(
      true,
    );
    expect(
      sameChoice(chosen, { kind: 'named', id: 'n1', name: 'Draft', moment: moment(300) }),
    ).toBe(false);
    expect(sameChoice(chosen, { kind: 'session', moment: moment(300) })).toBe(false);
  });

  it('nothing chosen is none of the moments', () => {
    expect(sameChoice(null, { kind: 'beginning', moment: moment(100) })).toBe(false);
  });
});
