import { describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGES_SERVER } from './languages';

import core from '/crates/core/src/languages.rs?raw';

describe('the server of language packages', () => {
  // The page names the default in the settings and stores nothing when the
  // writer types it; the core sends the requests there. Should the two
  // differ, the hint would name one server and the packages come from
  // another.
  it('is by default the one the core asks', () => {
    const rust = /pub const DEFAULT_SERVER: &str = "([^"]+)";/.exec(core);
    expect(rust, 'DEFAULT_SERVER in crates/core/src/languages.rs').not.toBeNull();
    expect(DEFAULT_LANGUAGES_SERVER).toBe(rust![1]);
  });
});
