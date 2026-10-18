import { describe, expect, it } from 'vitest';
import { CREDIT_GROUPS, isKey } from './credits';

import english from '/locales/en/credits.ftl?raw';
import packageJson from '/package.json?raw';
import workspaceToml from '/Cargo.toml?raw';
import appToml from '/src-tauri/Cargo.toml?raw';
import coreToml from '/crates/core/Cargo.toml?raw';
import pdfTextToml from '/crates/pdf-text/Cargo.toml?raw';
import serverToml from '/crates/server/Cargo.toml?raw';

/** The names of the messages of the English credits.ftl. */
const messages = new Set(
  english
    .split('\n')
    .filter((line) => /^[a-z]/.test(line) && line.includes('='))
    .map((line) => line.slice(0, line.indexOf('=')).trim()),
);

describe('the credits', () => {
  it('come in the order the brief gives, each group with a heading', () => {
    expect(CREDIT_GROUPS.map((g) => g.id)).toEqual([
      'built-on',
      'copied',
      'fonts',
      'data',
      'programs',
      'icons',
      'owl',
    ]);
    for (const group of CREDIT_GROUPS) {
      expect(messages, group.id).toContain(`credits-group-${group.id}`);
      expect(group.credits.length, group.id).toBeGreaterThan(0);
    }
  });

  it('say what each is in words that are there, with a licence and a link', () => {
    for (const credit of CREDIT_GROUPS.flatMap((g) => g.credits)) {
      for (const words of [credit.name, credit.what])
        if (isKey(words)) expect(messages, credit.name).toContain(words);
      expect(credit.licence.trim(), credit.name).not.toBe('');
      expect(credit.url, credit.name).toMatch(/^https?:\/\/\S+$/);
    }
  });

  it('name each project once', () => {
    const names = CREDIT_GROUPS.flatMap((g) => g.credits.map((c) => c.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('use every word of what a credit is that credits.ftl has', () => {
    const used = new Set(CREDIT_GROUPS.flatMap((g) => g.credits.flatMap((c) => [c.name, c.what])));
    const unused = [...messages].filter((m) => /^credits-(what|name)-/.test(m) && !used.has(m));
    expect(unused).toEqual([]);
  });
});

/**
 * The direct dependencies of a Cargo manifest that are compiled into what
 * is shipped: those of its `[dependencies]`, `[workspace.dependencies]` and
 * `[target.'…'.dependencies]`, not those that build it or test it, and not
 * the crates of Glaukopis itself (by `path`).
 */
function cargoDependencies(manifest: string): string[] {
  const names: string[] = [];
  let shipped = false;
  for (const line of manifest.split('\n')) {
    const section = /^\s*\[([^\]]+)\]/.exec(line);
    if (section) {
      shipped = /(^|\.)dependencies$/.test(section[1].trim());
      continue;
    }
    const dependency = /^\s*([A-Za-z0-9_-]+)\s*(=|\.workspace)/.exec(line);
    if (shipped && dependency && !/\bpath\s*=/.test(line)) names.push(dependency[1]);
  }
  return names;
}

/** What is credited under another name, or several under one. */
const CREDITED_AS: Record<string, string> = {
  '@fluent/bundle': 'Fluent (fluent.js)',
  '@fluent/syntax': 'Fluent (fluent.js)',
  '@fontsource-variable/inter': 'Inter',
  '@fontsource-variable/literata': 'Literata',
  '@fontsource/stix-two-math': 'STIX Two Math',
  '@lucide/svelte': 'Lucide',
  '@tauri-apps/api': 'Tauri',
  '@tauri-apps/plugin-dialog': 'Tauri plugins: dialog, opener',
  '@tauri-apps/plugin-opener': 'Tauri plugins: dialog, opener',
  'tauri-plugin-dialog': 'Tauri plugins: dialog, opener',
  'tauri-plugin-opener': 'Tauri plugins: dialog, opener',
  gtk: 'gtk-rs',
  webkit2gtk: 'webkit2gtk-rs',
  'fluent-bundle': 'Fluent (fluent-rs)',
  'fluent-syntax': 'Fluent (fluent-rs)',
  'typst-svg': 'Typst',
  'typst-layout': 'Typst',
  'typst-pdf': 'Typst',
  'typst-kit': 'Typst',
  icu_properties: 'ICU4X (icu_properties)',
  sha2: 'sha2 (RustCrypto)',
  serde: 'Serde (serde, serde_json)',
  serde_json: 'Serde (serde, serde_json)',
  tracing: 'tracing (tracing, tracing-subscriber)',
  'tracing-subscriber': 'tracing (tracing, tracing-subscriber)',
};

/** The credit a dependency is named in: by the map above, all the ProseMirror packages as one, else by its own name. */
function creditOf(dependency: string): string {
  if (dependency.startsWith('prosemirror-')) return 'ProseMirror';
  return CREDITED_AS[dependency] ?? dependency;
}

describe('the credits and the manifests', () => {
  const credited = new Set(
    CREDIT_GROUPS.flatMap((g) => g.credits.map((c) => c.name.toLowerCase())),
  );
  const manifests: [string, string[]][] = [
    ['package.json', Object.keys(JSON.parse(packageJson).dependencies ?? {})],
    ['Cargo.toml', cargoDependencies(workspaceToml)],
    ['src-tauri/Cargo.toml', cargoDependencies(appToml)],
    ['crates/core/Cargo.toml', cargoDependencies(coreToml)],
    ['crates/pdf-text/Cargo.toml', cargoDependencies(pdfTextToml)],
    ['crates/server/Cargo.toml', cargoDependencies(serverToml)],
  ];

  it('are read from every manifest', () => {
    for (const [manifest, names] of manifests) expect(names.length, manifest).toBeGreaterThan(0);
    expect(cargoDependencies(coreToml)).toContain('flate2');
    // Not what builds or tests, and not the crates of Glaukopis itself.
    expect(cargoDependencies(appToml)).not.toContain('tauri-build');
    expect(cargoDependencies(appToml)).not.toContain('glaukopis-core');
    expect(cargoDependencies(serverToml)).not.toContain('tokio-tungstenite');
  });

  it('credit every direct dependency of what is shipped', () => {
    const missing = manifests.flatMap(([manifest, names]) =>
      names
        .filter((name) => !credited.has(creditOf(name).toLowerCase()))
        .map((name) => `${manifest}: ${name}`),
    );
    expect(missing).toEqual([]);
  });

  it('name only credits that are there for what is credited under another name', () => {
    for (const name of new Set(Object.values(CREDITED_AS)))
      expect(credited, name).toContain(name.toLowerCase());
  });
});
