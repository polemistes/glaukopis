# 0102 — The plugin for Firefox, and collecting from what is read in Glaukopis

Date: 2026-11-16. Status: built on 2026-11-15 and 2026-11-16, as stage 3 of `docs/plans/the-notebook.md`, from the owner's words of 2026-11-15 (`docs/brief.md`): "I want the browser plugins", "We support only Firefox for now", "I don't want to pay a fee, as things are now". It stands on record 0101. The plugin is not signed: that needs an account with Mozilla, which is the owner's to make.

## Context

- **Only the browser knows the page.** The owner asked whether Glaukopis could know which page a screenshot was taken from; it cannot, and what Firefox says on the clipboard is the site and not the page (record 0101). A plugin in the browser can say the page.
- **Nothing may leave the computer, no port may be opened, and nothing may cost a fee.** Firefox's native messaging starts a program named in a small file and speaks with it over its input and output.
- **The application already starts itself in another role** for work that can crash (`--glaukopis-isolated`).
- **A file read in Glaukopis** had no way to give a passage to anything: its words can be selected and copied, and nothing carries the reference and the page along.

## Decision

1. **The helper is the application itself.** Started with the path of its own manifest (`org.glaukopis.notebook.json`) as its first argument, as Firefox starts it, it is the helper and nothing else: no window, no claim on the data folder (`crates/core/src/notebook/host.rs`; decided first thing in `main`). No second program is built or packaged.
2. **What the plugin hands over is written into an inbox** of the notebook, `notebook/inbox/` in the data folder, each thing a folder of its own that is made whole before it is named. The helper needs no running application, and the application is never reached from outside. The application looks at the inbox every second and a half while it runs, asks how many things wait, reads the notebook, and only then takes them: a notebook that cannot be read leaves them where they are. The inbox is the application's own: it is no folder of the writer's to put things in.
3. **The messages**: `hello`, answered with the version; and a thing collected, of the kind `page`, `selection`, `image` or `region`, with the page's address and title, when, its words and HTML, or a picture in base64, answered `ok` or one word of what went wrong (`not-understood`, `too-large`, `not-a-picture`, `no-data-folder`, `not-written`). The words the writer sees are the plugin's.
4. **Firefox is set up from the settings**: **Settings › Firefox › Set up** writes the manifest for this user (Linux `~/.mozilla/native-messaging-hosts/`, macOS under `Library/Application Support/Mozilla`, Windows a file beside the settings and a key of the user's registry), naming this program and the plugin; **Remove** takes it away. Nothing is written there unasked.
5. **The plugin** (`extension/firefox/`, Manifest V3, plain JavaScript, no build step) hands over the page (its readable text, by Mozilla's Readability, which is in the plugin as it is), what is selected, an image, or a part of the page marked with the pointer. It asks for `activeTab`, `contextMenus`, `scripting` and `nativeMessaging` and no site: it sees only the page in view, when asked. An image is drawn from the page where the page allows it, else cut out of a picture of the tab; nothing is fetched, by the plugin or by the application. It says what happened by a sign on its button, and nothing else.
6. **Each thing is a note** with the page as its source: a page named by its title, its text taken in as one passage; a selection the same without a name; a picture as a figure. HTML from a page is read without being run and rebuilt from a short list of what a text can hold before the schema reads it, so that nothing of the page is taken for Glaukopis's own marks.
7. **From a file read in Glaukopis**: **To the notebook** in the bar of a PDF or an image, in a side and in the library (Ctrl+Shift+J). With words selected, they are a note, taken in as one passage, their lines joined into running text; with nothing selected, a part of the page is marked with the pointer and is a picture in a note. The source is the file's reference with the page as its place, as the file numbers its pages in print; chosen where the file has several; the file itself, with its page, where it has none. The notebook does not come to hold the file read.

## Tried

- **In a real Firefox** (159, Linux, off-screen, a throwaway profile and a throwaway home, the plugin loaded unsigned by Mozilla's `web-ext`): the application set Firefox up; the plugin's key handed the page over, and it was a note named by the page, its text as the page reads, its link kept, its source the page with its whole address; with words selected the key handed over the selection. Nine checks, all passed.
- **Not tried**: the image and the marked part from Firefox's own menus, which a script cannot open (their reckoning is tested without a browser); Firefox as a Snap or a Flatpak; Windows and macOS, where the registry key, the folder of the manifest and the helper's input and output in a program without a console are written and not run.

## Chosen in the building, and not asked

- The plugin declares to Mozilla that it handles the address and the content of pages (`browsingActivity`, `websiteContent`), since Mozilla's policy counts what is handed to a program on the same computer; Firefox says so at installing. The owner may judge otherwise when signing: it is one line of the manifest.
- The plugin's id is `notebook@glaukopis`, its key Alt+Shift+N, its name *Glaukopis Notebook* (*Glaukopis notatblokk*), its icon the owl.
- The inbox is told to one window (the first), and told again every half minute while things lie untaken.
- A thing that cannot be read is set aside in the inbox, not lost and not in the way.
- A picture is at most 50 MB, words and HTML 8 MB each (cut, not refused).
- The helper finds the data folder as the application does, and does not make it: where Glaukopis has never been started it answers `no-data-folder`.
- Where an AppImage runs, the manifest names the AppImage.
- From a page, lists and quotations arrive as points and quotations; headings as text; images inside the text are left out.
- In a file read: a line that ends in a hyphen before a small letter is joined without it; a paragraph is told by the gap between lines; the picture of a marked part is named after the file and the page; an image has no page.
- A file's source may carry a page.

## Left for later

- **The signature**, and offering the signed file from the owner's site, with the address in the settings.
- Firefox as a Flatpak, which needs leave given by hand.
- The words of the plugin and of the settings in the other languages.

## Checked

`cargo test --workspace`, `cargo clippy`, `pnpm check`, `pnpm test`. Against the built application: `e2e/notebook-plugin.mjs` (25 checks: the settings, the manifest, the helper spoken to as Firefox speaks to it, notes of a selection, a part of a page and a page, harmful HTML of which nothing survives) and `e2e/notebook-from-file.mjs` (24 checks); and the trial in a real Firefox above.
