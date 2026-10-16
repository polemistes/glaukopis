# 0048 — Pasting on Linux goes past WebKitGTK: the clipboard is read through GTK by the Rust side

Date: 2026-10-16. Status: accepted by the owner on 2026-10-16.

## Context

On 2026-10-16 Glaukopis 0.2.0 ended while the owner scrolled through a text: the scrolling stood still for some seconds, then the whole application was gone. The kernel logged a segmentation fault at address 0 in `libwebkit2gtk-4.1.so` 2.54.1, in the application's own process.

The address is in `WebKit::Clipboard::formats` (`Source/WebKit/UIProcess/gtk/ClipboardGtk3.cpp`, line 85). To paste, WebKit asks GTK which formats the clipboard holds and goes through the list it is given. Where the clipboard cannot answer, because it is empty or because the program that holds it does not answer, GTK gives no list and a count of −1 (`gtk_selection_data_get_targets`); WebKit does not look, and reads from address 0. WebKit's main branch had the same code on that day.

It was made to happen off-screen, with the harness: Ctrl+V with an empty clipboard, Ctrl+V or the middle button with a program holding the clipboard that refuses its formats, and the middle button with nothing selected: each ended the application after some seconds, at the same instruction. On Linux the middle button pastes the text last selected anywhere, and a wheel pressed while scrolling is a press of it: that is the likeliest way it came about. Where the page stopped the paste event before WebKit read the clipboard, WebKit never asked, and the application lived.

## Decision

On Linux every paste in the window is stopped where it begins, before WebKit reads anything (`src/lib/util/paste.ts`, installed in `main.ts`). The Rust side reads the clipboard through GTK (`clipboard_read`, `src-tauri/src/commands/clipboard.rs`): the formats first, and a clipboard that has none gives nothing; then the HTML, the text, a picture as PNG, and the files of pictures copied in a file manager. The paste is then given again to where it was aimed, with what was read, so that the editors, the tables and the fields take it as they took WebKit's; a field or editable text that no handler takes gets the text as WebKit would have put it in. The middle button reads the primary selection, the clipboard of what was last selected; the keys read the clipboard.

GTK is already a dependency on Linux, through Tauri; nothing is added. GTK's requests wait for the clipboard without holding the window still, and a holder that does not answer in ten seconds gives nothing.

Windows and macOS do not run WebKitGTK and paste as before.

## Consequences

- The crash cannot come from pasting. WebKit reads the clipboard nowhere else in the application: its own context menu, with its Paste, is never shown, and the page does not use `navigator.clipboard.read`.
- A paste reaches the page a moment later than before, after the Rust side has answered.
- WebKit should be told; the report is in `docs/research/webkitgtk-paste-crash.md`. When a WebKitGTK with the fix is what the distributions ship, this can be undone.
- `e2e/paste.mjs` checks the empty clipboard, the empty selection, a copy and paste within the text with its marks, the middle button, and a field.
