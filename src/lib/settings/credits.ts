/**
 * The credits of Glaukopis: what it is built on, what was copied into it,
 * the fonts, the data and the programs it comes with or calls, the icons
 * and the owl, each with its licence and where it is found. Shown by the
 * dialog of credits, from the About section of the settings.
 *
 * Kept by hand. Every licence was read from the package's own metadata or
 * licence file, not from memory: the Cargo.toml and LICENSE files of the
 * crates as the registry has them, the package.json and LICENSE files of
 * the packages of the interface, the NOTICE of typst-assets for Typst's
 * fonts, the READMEs of the dictionaries, and the licence files of the
 * programs as the system has them. Licences are written as SPDX names
 * them, `Apache-2.0/MIT` as `Apache-2.0 OR MIT`; where SPDX has no name for
 * a licence, its own name is written. Only what is in the application or
 * comes with it is here: what builds it or tests it is not.
 *
 * When a dependency is added to `Cargo.toml` (of `src-tauri` or of a crate
 * under `crates/`) or to the dependencies of `package.json`, it is added
 * here too.
 */

export interface Credit {
  /** Its name, as the project gives it; or a key of credits.ftl (`credits-name-…`) where it is ours to name. */
  name: string;
  /** What it is to Glaukopis, as a key of credits.ftl (`credits-what-…`), or plain words where none. */
  what: string;
  /** Its licence, as SPDX names it where it can: `MIT OR Apache-2.0`. */
  licence: string;
  /** The project's home or repository. */
  url: string;
  /** The authors, where the licence asks for them to be named. */
  by?: string;
}

export interface CreditGroup {
  /** The group, which is its heading as `credits-group-{id}` in credits.ftl. */
  id: string;
  credits: Credit[];
}

/** Whether the name or the what of a credit is a key of credits.ftl, not plain words. */
export const isKey = (words: string) => words.startsWith('credits-');

/** The licence of Glaukopis itself. */
export const OWN_LICENCE = 'GPL-3.0-or-later';

export const CREDIT_GROUPS: CreditGroup[] = [
  {
    // The frameworks and libraries compiled into it: the direct dependencies
    // of src-tauri, of crates/core, crates/pdf-text and crates/server, and of
    // the interface.
    id: 'built-on',
    credits: [
      {
        name: 'Tauri',
        what: 'credits-what-tauri',
        licence: 'Apache-2.0 OR MIT',
        url: 'https://tauri.app',
        by: 'Tauri Apps Contributors',
      },
      {
        name: 'Tauri plugins: dialog, opener',
        what: 'credits-what-tauri-plugins',
        licence: 'Apache-2.0 OR MIT',
        url: 'https://github.com/tauri-apps/plugins-workspace',
        by: 'Tauri Apps Contributors',
      },
      {
        name: 'WebKitGTK',
        what: 'credits-what-webkitgtk',
        licence: 'LGPL-2.1-or-later AND BSD-2-Clause, among others',
        url: 'https://webkitgtk.org',
      },
      {
        name: 'gtk-rs',
        what: 'credits-what-gtk',
        licence: 'MIT',
        url: 'https://github.com/gtk-rs/gtk3-rs',
        by: 'The gtk-rs Project Developers',
      },
      {
        name: 'webkit2gtk-rs',
        what: 'credits-what-gtk',
        licence: 'MIT',
        url: 'https://github.com/tauri-apps/webkit2gtk-rs',
        by: 'Antoni Boucher, The Gtk-rs Project Developers, Tauri Programme within The Commons Conservancy',
      },
      {
        name: 'Svelte',
        what: 'credits-what-svelte',
        licence: 'MIT',
        url: 'https://svelte.dev',
        by: 'Svelte Contributors',
      },
      {
        name: 'ProseMirror',
        what: 'credits-what-prosemirror',
        licence: 'MIT',
        url: 'https://prosemirror.net',
        by: 'Marijn Haverbeke and others',
      },
      {
        name: 'Yjs',
        what: 'credits-what-yjs',
        licence: 'MIT',
        url: 'https://github.com/yjs/yjs',
        by: 'Kevin Jahns',
      },
      {
        name: 'y-prosemirror',
        what: 'credits-what-y-prosemirror',
        licence: 'MIT',
        url: 'https://github.com/yjs/y-prosemirror',
        by: 'Kevin Jahns',
      },
      {
        name: 'y-protocols',
        what: 'credits-what-y-protocols',
        licence: 'MIT',
        url: 'https://github.com/yjs/y-protocols',
        by: 'Kevin Jahns',
      },
      {
        name: 'lib0',
        what: 'credits-what-lib0',
        licence: 'MIT',
        url: 'https://github.com/dmonad/lib0',
        by: 'Kevin Jahns',
      },
      {
        name: 'Yrs',
        what: 'credits-what-yrs',
        licence: 'MIT',
        url: 'https://github.com/y-crdt/y-crdt',
        by: 'Kevin Jahns, Bartosz Sypytkowski',
      },
      {
        name: 'fractional-indexing',
        what: 'credits-what-fractional-indexing',
        licence: 'CC0-1.0',
        url: 'https://github.com/rocicorp/fractional-indexing',
      },
      {
        name: 'Fluent (fluent.js)',
        what: 'credits-what-fluent-js',
        licence: 'Apache-2.0',
        url: 'https://projectfluent.org',
        by: 'Mozilla',
      },
      {
        name: 'Fluent (fluent-rs)',
        what: 'credits-what-fluent-rs',
        licence: 'Apache-2.0 OR MIT',
        url: 'https://github.com/projectfluent/fluent-rs',
        by: 'Mozilla',
      },
      {
        name: 'intl_pluralrules',
        what: 'credits-what-pluralrules',
        licence: 'Apache-2.0 OR MIT',
        url: 'https://github.com/zbraniecki/pluralrules',
        by: 'Kekoa Riggin, Zibi Braniecki',
      },
      {
        name: 'unic-langid',
        what: 'credits-what-unic-langid',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/zbraniecki/unic-locale',
        by: 'Zibi Braniecki',
      },
      {
        name: 'sys-locale',
        what: 'credits-what-sys-locale',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/1Password/sys-locale',
        by: '1Password',
      },
      {
        name: 'Typst',
        what: 'credits-what-typst',
        licence: 'Apache-2.0',
        url: 'https://typst.app',
        by: 'The Typst Project Developers',
      },
      {
        name: 'comemo',
        what: 'credits-what-comemo',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/typst/comemo',
      },
      {
        name: 'hayro',
        what: 'credits-what-hayro',
        licence: 'Apache-2.0 OR MIT',
        url: 'https://github.com/LaurenzV/hayro',
        by: 'The Hayro Authors',
      },
      {
        name: 'lopdf',
        what: 'credits-what-lopdf',
        licence: 'MIT',
        url: 'https://github.com/J-F-Liu/lopdf',
        by: 'Junfeng Liu',
      },
      {
        name: 'adobe-cmap-parser',
        what: 'credits-what-pdf-text-part',
        licence: 'MIT',
        url: 'https://github.com/jrmuizel/adobe-cmap-parser',
        by: 'Jeff Muizelaar',
      },
      {
        name: 'type1-encoding-parser',
        what: 'credits-what-pdf-text-part',
        licence: 'MIT',
        url: 'https://github.com/jrmuizel/type1-encoding-parser',
        by: 'Jeff Muizelaar',
      },
      {
        name: 'cff-parser',
        what: 'credits-what-pdf-text-part',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/jrmuizel/cff-parser',
        by: 'Yevhenii Reizner, Jeff Muizelaar',
      },
      {
        name: 'postscript',
        what: 'credits-what-pdf-text-part',
        licence: 'Apache-2.0 OR MIT',
        url: 'https://github.com/bodoni/postscript',
        by: 'The postscript Developers',
      },
      {
        name: 'euclid',
        what: 'credits-what-pdf-text-part',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/servo/euclid',
        by: 'The Servo Project Developers',
      },
      {
        name: 'image',
        what: 'credits-what-image',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/image-rs/image',
        by: 'The image-rs Developers',
      },
      {
        name: 'rusqlite',
        what: 'credits-what-rusqlite',
        licence: 'MIT',
        url: 'https://github.com/rusqlite/rusqlite',
        by: 'The rusqlite developers',
      },
      {
        name: 'SQLite',
        what: 'credits-what-sqlite',
        licence: 'Public domain',
        url: 'https://sqlite.org',
      },
      {
        name: 'roxmltree',
        what: 'credits-what-roxmltree',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/RazrFalcon/roxmltree',
        by: 'Yevhenii Reizner',
      },
      {
        name: 'zip',
        what: 'credits-what-zip',
        licence: 'MIT',
        url: 'https://github.com/zip-rs/zip2',
        by: 'Mathijs van de Nes and others',
      },
      {
        name: 'calamine',
        what: 'credits-what-calamine',
        licence: 'MIT',
        url: 'https://github.com/tafia/calamine',
        by: 'Johann Tuffe',
      },
      {
        name: 'encoding_rs',
        what: 'credits-what-encoding-rs',
        licence: '(Apache-2.0 OR MIT) AND BSD-3-Clause',
        url: 'https://github.com/hsivonen/encoding_rs',
        by: 'Henri Sivonen; WHATWG (Apple, Google, Mozilla, Microsoft)',
      },
      {
        name: 'spellbook',
        what: 'credits-what-spellbook',
        licence: 'MPL-2.0',
        url: 'https://github.com/helix-editor/spellbook',
      },
      {
        name: 'ICU4X (icu_properties)',
        what: 'credits-what-icu',
        licence: 'Unicode-3.0',
        url: 'https://github.com/unicode-org/icu4x',
        by: 'Unicode, Inc.',
      },
      {
        name: 'unicode-normalization',
        what: 'credits-what-unicode-normalization',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/unicode-rs/unicode-normalization',
        by: 'The Rust Project Developers',
      },
      {
        name: 'strsim',
        what: 'credits-what-strsim',
        licence: 'MIT',
        url: 'https://github.com/rapidfuzz/strsim-rs',
        by: 'Danny Guo and others',
      },
      {
        name: 'ureq',
        what: 'credits-what-ureq',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/algesten/ureq',
        by: 'Martin Algesten',
      },
      {
        name: 'sha2 (RustCrypto)',
        what: 'credits-what-sha2',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/RustCrypto/hashes',
        by: 'RustCrypto Developers',
      },
      {
        name: 'base64',
        what: 'credits-what-base64',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/marshallpierce/rust-base64',
        by: 'Alice Maz, Marshall Pierce',
      },
      {
        name: 'Serde (serde, serde_json)',
        what: 'credits-what-serde',
        licence: 'MIT OR Apache-2.0',
        url: 'https://serde.rs',
        by: 'Erick Tryzelaar, David Tolnay',
      },
      {
        name: 'uuid',
        what: 'credits-what-uuid',
        licence: 'Apache-2.0 OR MIT',
        url: 'https://github.com/uuid-rs/uuid',
        by: 'Ashley Mannix, Christopher Armstrong, Dylan DPC, Hunar Roop Kahlon',
      },
      {
        name: 'time',
        what: 'credits-what-time',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/time-rs/time',
        by: 'Jacob Pratt and others',
      },
      {
        name: 'tempfile',
        what: 'credits-what-tempfile',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/Stebalien/tempfile',
        by: 'Steven Allen',
      },
      {
        name: 'tracing (tracing, tracing-subscriber)',
        what: 'credits-what-tracing',
        licence: 'MIT',
        url: 'https://github.com/tokio-rs/tracing',
        by: 'Tokio Contributors',
      },
      {
        name: 'log',
        what: 'credits-what-tracing',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/rust-lang/log',
        by: 'The Rust Project Developers',
      },
      {
        name: 'thiserror',
        what: 'credits-what-thiserror',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/dtolnay/thiserror',
        by: 'David Tolnay',
      },
      {
        name: 'Tokio',
        what: 'credits-what-tokio',
        licence: 'MIT',
        url: 'https://tokio.rs',
        by: 'Tokio Contributors',
      },
      {
        name: 'axum',
        what: 'credits-what-axum',
        licence: 'MIT',
        url: 'https://github.com/tokio-rs/axum',
        by: 'axum Contributors',
      },
      {
        name: 'futures-util',
        what: 'credits-what-futures',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/rust-lang/futures-rs',
        by: 'Alex Crichton, The Tokio Authors',
      },
      {
        name: 'clap',
        what: 'credits-what-clap',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/clap-rs/clap',
      },
      {
        name: 'getrandom',
        what: 'credits-what-getrandom',
        licence: 'MIT OR Apache-2.0',
        url: 'https://github.com/rust-random/getrandom',
        by: 'The rust-random Project Developers, The Rust Project Developers',
      },
    ],
  },
  {
    // Code taken into the tree, as it was or changed.
    id: 'copied',
    credits: [
      {
        name: 'pdf-extract',
        what: 'credits-what-pdf-extract',
        licence: 'MIT',
        url: 'https://github.com/jrmuizel/pdf-extract',
        by: 'Jeff Muizelaar',
      },
      {
        name: 'wrap-it',
        what: 'credits-what-wrap-it',
        licence: 'Unlicense',
        url: 'https://github.com/ntjess/wrap-it',
        by: 'Nathan Jessurun',
      },
    ],
  },
  {
    id: 'fonts',
    credits: [
      {
        name: 'Literata',
        what: 'credits-what-literata',
        licence: 'OFL-1.1',
        url: 'https://github.com/googlefonts/literata',
        by: 'The Literata Project Authors',
      },
      {
        name: 'Inter',
        what: 'credits-what-inter',
        licence: 'OFL-1.1',
        url: 'https://github.com/rsms/inter',
        by: 'The Inter Project Authors',
      },
      {
        name: 'STIX Two Math',
        what: 'credits-what-stix',
        licence: 'OFL-1.1',
        url: 'https://github.com/stipub/stixfonts',
        by: 'The STIX Fonts Project Authors',
      },
      {
        name: 'Libertinus Serif',
        what: 'credits-what-typst-font',
        licence: 'OFL-1.1',
        url: 'https://github.com/alerque/libertinus',
        by: 'The Libertinus Project Authors',
      },
      {
        name: 'New Computer Modern',
        what: 'credits-what-typst-font',
        licence:
          'GUST Font License 1.0; GPL-3.0-or-later WITH Font-exception-2.0 (NewCM10 Regular)',
        url: 'https://ctan.org/pkg/newcomputermodern',
      },
      {
        name: 'DejaVu Sans Mono',
        what: 'credits-what-typst-font',
        licence: 'Bitstream-Vera, Arev Fonts License',
        url: 'https://dejavu-fonts.github.io',
        by: 'Bitstream, Inc.; Tavmjong Bah; the DejaVu authors',
      },
      {
        name: 'Foxit fonts (PDFium)',
        what: 'credits-what-foxit',
        licence: 'BSD-3-Clause',
        url: 'https://pdfium.googlesource.com/pdfium/',
        by: 'PDFium Authors',
      },
    ],
  },
  {
    id: 'data',
    credits: [
      {
        name: 'Citation Style Language styles',
        what: 'credits-what-csl-styles',
        licence: 'CC-BY-SA-3.0',
        url: 'https://github.com/citation-style-language/styles',
        by: 'The authors each style names',
      },
      {
        name: 'Citation Style Language locales',
        what: 'credits-what-csl-locales',
        licence: 'CC-BY-SA-3.0',
        url: 'https://github.com/citation-style-language/locales',
      },
      {
        name: 'Bokmålsordboka, Nynorskordboka',
        what: 'credits-what-ordboka',
        licence: 'CC-BY-4.0',
        url: 'https://ordbokene.no',
        by: 'Universitetet i Bergen og Språkrådet',
      },
      {
        name: 'Norsk ordbank',
        what: 'credits-what-ordbank',
        licence: 'CC-BY-4.0',
        url: 'https://www.nb.no/sprakbanken/ressurskatalog/oai-nb-no-sbr-5/',
        by: 'Nasjonalbiblioteket (Språkbanken)',
      },
      {
        name: 'spell-norwegian',
        what: 'credits-what-spell-norwegian',
        licence: 'GPL-2.0-only',
        url: 'https://github.com/LibreOffice/dictionaries/tree/master/no',
        by: 'The spell-norwegian project',
      },
      {
        name: 'SCOWL',
        what: 'credits-what-spelling-en-us',
        licence: "SCOWL's licence; Ispell's BSD licence for the rules",
        url: 'https://github.com/kevina/wordlist',
        by: 'Kevin Atkinson; Geoff Kuenning',
      },
      {
        name: 'English dictionary of LibreOffice (en_GB)',
        what: 'credits-what-spelling-en-gb',
        licence: 'LGPL-2.1-or-later',
        url: 'https://github.com/marcoagpinto/aoo-mozilla-en-dict',
        by: 'Kevin Atkinson, David Bartlett, Brian Kelk, Andrew Brown, Marco A. G. Pinto',
      },
      {
        name: 'Swedish Dictionary for Spell Checking',
        what: 'credits-what-spelling-sv',
        licence: 'LGPL-3.0-only',
        url: 'https://github.com/LibreOffice/dictionaries/tree/master/sv_SE',
        by: 'Göran Andersson',
      },
      {
        name: 'Stavekontrolden',
        what: 'credits-what-spelling-da',
        licence: 'GPL-2.0-only OR LGPL-2.1-only OR MPL-1.1',
        url: 'http://www.stavekontrolden.dk',
        by: 'Foreningen for frit tilgængelige sprogværktøjer',
      },
      {
        name: 'igerman98 (de_DE_frami)',
        what: 'credits-what-spelling-de',
        licence: 'GPL-2.0-only OR GPL-3.0-only',
        url: 'https://www.j3e.de/ispell/igerman98/',
        by: 'Björn Jacke, Franz Michael Baumann',
      },
      {
        name: 'Dictionnaires orthographiques français (Grammalecte)',
        what: 'credits-what-spelling-fr',
        licence: 'MPL-2.0',
        url: 'https://grammalecte.net',
        by: 'Olivier R. and contributors',
      },
      {
        name: 'Estensione linguistica italiana',
        what: 'credits-what-spelling-it',
        licence: 'GPL-3.0-only',
        url: 'https://libreitalia.org',
        by: 'LibreItalia, Marina Latini, and others',
      },
      {
        name: 'tessdata_best',
        what: 'credits-what-tessdata',
        licence: 'Apache-2.0',
        url: 'https://github.com/tesseract-ocr/tessdata_best',
      },
    ],
  },
  {
    // Called where they are installed; none of them comes with Glaukopis.
    id: 'programs',
    credits: [
      {
        name: 'Pandoc',
        what: 'credits-what-pandoc',
        licence: 'GPL-2.0-or-later',
        url: 'https://pandoc.org',
        by: 'John MacFarlane and others',
      },
      {
        name: 'Tesseract',
        what: 'credits-what-tesseract',
        licence: 'Apache-2.0',
        url: 'https://github.com/tesseract-ocr/tesseract',
      },
      {
        name: 'Poppler (pdftoppm)',
        what: 'credits-what-poppler',
        licence: 'GPL-2.0-only OR GPL-3.0-only',
        url: 'https://poppler.freedesktop.org',
      },
      {
        name: 'LaTeX',
        what: 'credits-what-latex',
        licence: 'LPPL-1.3c',
        url: 'https://www.latex-project.org',
        by: 'The LaTeX Project',
      },
    ],
  },
  {
    id: 'icons',
    credits: [
      {
        name: 'Lucide',
        what: 'credits-what-lucide',
        licence: 'ISC',
        url: 'https://lucide.dev',
        by: 'Lucide Icons and Contributors',
      },
      {
        name: 'Feather',
        what: 'credits-what-feather',
        licence: 'MIT',
        url: 'https://github.com/feathericons/feather',
        by: 'Cole Bemis',
      },
    ],
  },
  {
    id: 'owl',
    credits: [
      {
        name: 'credits-name-owl',
        what: 'credits-what-owl',
        licence: 'CC-BY-SA-3.0',
        url: 'https://github.com/polemistes/glaukopis/tree/main/resources/brand',
        by: 'Robert Emil Berge',
      },
      {
        name: 'SNG Copenhagen 39',
        what: 'credits-what-owl-photo',
        licence: 'CC-BY-SA-3.0',
        url: 'https://commons.wikimedia.org/wiki/File:SNGCop_039.jpg',
        by: 'Classical Numismatic Group, Inc. (http://www.cngcoins.com)',
      },
    ],
  },
];
