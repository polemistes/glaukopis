import { describe, expect, it } from 'vitest';
import { hoverOutside, styleOf } from './hover';

// Every file the phone's page draws: its own, and the shared ones it uses.
// A part that comes to draw another shared file adds it here and makes it pass.
const own = import.meta.glob('/src/lib/phone/**/*.svelte', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const shared = import.meta.glob(
  [
    '/src/lib/ui/Button.svelte',
    '/src/lib/ui/IconButton.svelte',
    '/src/lib/ui/Segmented.svelte',
    '/src/lib/ui/TextField.svelte',
    '/src/lib/ui/Toaster.svelte',
    '/src/lib/ui/Dialog.svelte',
    '/src/lib/ui/ConfirmHost.svelte',
    '/src/lib/ui/EmptyState.svelte',
    '/src/lib/ui/Spinner.svelte',
    '/src/lib/notebook/TagsField.svelte',
    '/src/lib/notebook/HeldFile.svelte',
    '/src/lib/files/Thumb.svelte',
    '/src/lib/sync/SyncSettings.svelte',
    '/src/app.css',
    '/src/placing.css',
  ],
  { query: '?raw', import: 'default', eager: true },
);

describe('what is shown under a pointer', () => {
  it('is found outside a block for a pointer that hovers, and not inside one', () => {
    const css = `
      .a:hover { color: red; }
      @media (hover: hover) { .b:hover { color: red; } }
      .c, .d:hover:not(:disabled) { color: red; }
      ::-webkit-scrollbar-thumb:hover { background: grey; }
      /* .e:hover { } */
      @media (max-width: 400px) { .f:hover { color: red; } }`;
    expect(hoverOutside(css).map((f) => f.selector)).toEqual([
      '.a:hover',
      '.c, .d:hover:not(:disabled)',
      '.f:hover',
    ]);
  });

  it('is shown only where there is a pointer that hovers, in every file the phone draws', () => {
    const files = { ...own, ...shared } as Record<string, string>;
    expect(Object.keys(shared)).toHaveLength(15);
    const outside = Object.entries(files).flatMap(([file, source]) =>
      hoverOutside(styleOf(source, file)).map((f) => `${file}:${f.line} ${f.selector}`),
    );
    expect(outside).toEqual([]);
  });
});
