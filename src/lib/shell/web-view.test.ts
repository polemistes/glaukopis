import { describe, expect, it } from 'vitest';
import { missingFromWebView, type WebView } from './web-view';

/** A web view that has it all. */
const recent = (): WebView => ({
  structuredClone: () => null,
  crypto: { randomUUID: () => '' },
  Array: { prototype: { at: () => null } },
  HTMLDialogElement: { prototype: { showModal: () => {} } },
  CSS: { supports: () => true },
  RegExp: RegExp,
});

describe('the web view', () => {
  it('lacks nothing where it has it all', () => {
    expect(missingFromWebView(recent())).toEqual([]);
  });

  it('is said to lack what Safari 14 lacks, by name', () => {
    const safari14: WebView = {
      ...recent(),
      structuredClone: undefined,
      crypto: {},
      Array: { prototype: {} },
      HTMLDialogElement: undefined,
      CSS: { supports: () => false },
      RegExp: class {
        constructor(source: string) {
          if (source.includes('(?<'))
            throw new SyntaxError('Invalid regular expression: invalid group specifier name');
        }
      },
    };
    expect(missingFromWebView(safari14)).toEqual([
      'structuredClone',
      'crypto.randomUUID',
      'Array.prototype.at',
      'dialog',
      'color-mix',
      'lookbehind',
    ]);
  });
});
