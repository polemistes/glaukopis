# Glaukopis

A desktop application for scholarly work. It is where the work on an academic
book or article is done: collecting references, developing ideas in mind maps,
writing, and producing the manuscript.

It is made for a way of working that begins with references and ideas, and
for scholars in the humanities first, the social sciences second.

- **Maps that are documents.** Ideas are elements of a map, with text,
  citations, notes, figures and mathematics. The same map is read as a
  diagram, as text, and as the manuscript.
- **One library** for all projects, kept as a BibLaTeX file that other tools
  can read. References are looked up by DOI, ISBN or title, made from PDF
  files, and imported from `.bib` files and from Zotero.
- **The manuscript as the publisher wants it.** Reference styles and
  document formats can be chosen and changed; export to PDF, set by Typst
  or by LaTeX, and to Word, OpenDocument, LaTeX, Markdown and HTML.
- **Working together**, through a small server of one's own.

How to use it is told in [docs/guide.md](docs/guide.md); how to run a server
in [docs/server.md](docs/server.md).

## Where things are

| | |
| --- | --- |
| `docs/brief.md` | What was asked for, in the words of the one who asked. |
| `PLAN.md` | The plan: the stack, the central idea, the milestones. |
| `docs/adr/` | The decisions, one in each file, with their reasons. |
| `docs/research/` | What was found out about publishers' requirements and about the services that are asked for references. |
| `crates/core/` | Everything that is data and not interface: the library, BibLaTeX, duplicates, import, lookup, projects on disk, export. Does not depend on Tauri. |
| `crates/server/` | The collaboration server. |
| `src-tauri/` | The desktop application: a window, and commands that call the core. |
| `src/` | The interface, in Svelte. |
| `resources/` | What comes with the application: reference styles, document formats, filters for Pandoc. |
| `e2e/` | Scripts that exercise the real application, off-screen. |
| `packaging/` | The package for Arch Linux, the desktop entry, the service of the server. |

## What it is made with

Rust and [Tauri 2](https://tauri.app) for the application, which uses the web
view of the system and brings no browser of its own; Svelte 5 and TypeScript
for the interface; ProseMirror for the text; Yjs for the project, which is
what lets several write in it at once. Pandoc makes the documents and Typst
the pages; both are used as they are installed. The reasons are in
`PLAN.md` and `docs/adr/0001-tauri-rust-svelte.md`.

## Building

Needed: Rust, Node.js, pnpm, and on Linux `webkit2gtk-4.1` and `gtk3` with
their headers. To use it, also Pandoc and Typst.

```
pnpm install
pnpm app            # the application, with the interface reloading as it is changed
pnpm app:build      # the application as it is released
cargo run -p glaukopis-server -- --help
```

On Arch Linux, `makepkg` in `packaging/arch` builds packages of the
application and of the server.

While it is being developed, the application keeps its data in
`~/.local/share/glaukopis`, as it does when installed. Set
`GLAUKOPIS_DATA_DIR` to try things out elsewhere.

## Testing

```
cargo test --workspace     # the core and the server
pnpm test                  # the model of the project, and other parts of the interface
pnpm check                 # types
pnpm e2e:build && pnpm e2e # the application itself
```

The last runs the real application on a display of its own (Xvfb), driven
through WebKitWebDriver, with a data directory that is thrown away. Nothing
appears on the desktop. It leaves screenshots in `e2e/output/`.
`pnpm e2e sharing` runs the scripts whose name contains *sharing*.

`e2e/sources.mjs` asks the real services a handful of questions; without the
network those checks are passed over. Tests of the core that ask the services
are marked `#[ignore]`.

## Licence

GPL-3.0-or-later. See [LICENSE](LICENSE).
