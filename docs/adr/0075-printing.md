# 0075 — Printing: the document from the typesetting pane, a file from its view

Date: 2026-10-30. Status: accepted by the owner on 2026-10-30 ("Ok, make the build plan.", after "Should not Glaukopis be able to print?" and a question about what the dialog on Linux would be like). To be built from `docs/plans/printing.md`. Amends 0069 and 0072 (a file in a view is not printed: it is now), 0064 (the typesetting pane's header gains *Print…* beside *Export*), and the key table of 0062 and 0066 (**Ctrl+P** goes from the typesetting pane to printing; the pane takes **Ctrl+T**).

## Context

- **Nothing in the application prints.** The word is nowhere in the interface. A finished document reaches paper by *Export*, PDF, *Open*, and the print dialog of whatever program the system opens PDFs in. Records 0069 and 0072 said in so many words that a file shown in a view is not printed. The owner: a program that makes documents should print them.
- **The pages are there already.** Typst sets the document inside the application (`crates/core/src/export/typeset.rs`), and the typesetting pane draws every page as SVG (`typeset::svg`, through `document_preview` and `document_preview_pages`), the glyphs as outlines, so that a page needs no fonts wherever it is drawn. The set document is kept for a while per project (`KEPT` in `export/mod.rs`), and its pages are drawn from it as they come into view, at most twelve at a time (`MOST_PAGES`). The pages of a PDF of the library are drawn by pdftoppm in a served child process at any width asked (`file_page`, 0072), and an image is one page.
- **The webview prints on every platform.** Tauri 2.12 with wry 0.57: on Linux `Webview::print` runs WebKitGTK's `PrintOperation` with its dialog, GTK's own, the one Evince and gedit use, with CUPS's printers, printers found on the network, *Print to File* for PDF, PostScript and SVG, and the printer's own options read from its driver or IPP; on macOS `printOperationWithPrintInfo:` of the WKWebView, the standard print sheet, from macOS 11, which the bundle asks for already; on Windows `window.print()` of WebView2, Edge's print dialog with its preview, *Microsoft Print to PDF* among the printers. On Linux the `PrintOperation` can be made in the application's own code, since `gtk` and `webkit2gtk` are dependencies there already (`lib.rs`, `watch`), and given the paper size and the margins before the dialog opens; `print()` without a dialog, with settings that name GTK's file printer and an output file, prints to a PDF with no printer and no screen, which is how the harness can try it.
- **What the owner's machine shows.** No CUPS is installed, so the dialog there would offer *Print to File* and GTK's old *Print to LPR* row alone, with its command field; installing `cups` fills the list. The owner has not printed for years and asked what the dialog would be; answered in `docs/brief.md`.

## Decision

### Printing is one act, through the system's dialog

- **Print…** prints the pages as the application has them drawn, through the printing of the system: GTK's dialog on Linux, the print sheet on macOS, Edge's dialog on Windows. Printer, copies, range, two-sided and the rest are the dialog's; the application asks nothing of its own for a document. Nothing is sent anywhere but to that dialog.
- **The pages go through the webview.** The pages are laid, for the moment of printing, into the window's own page, each as one sheet of the document's size with no margins, hidden on the screen and shown to print alone; the webview prints, and the pages leave the page when the printing is over. On Linux the paper of the job is set to the document's page before the dialog opens, so an A4 document comes up as A4; on Windows the page size written into the style sets the paper of the preview; on macOS the paper is the system's default and a page of another size is fitted into it, keeping its proportions, as every browser prints. Since the page itself has no margins, no browser writes a title or a date on it.
- **A document prints as vector**, its SVG pages with their outlines; its text is as sharp as the printer. **A file prints its drawn pages**, at 300 dots per inch, in colour as the viewer draws them; an image is one page the size of the image at its own resolution, or at 300 dots per inch where it says none.

### From the typesetting pane, and with Ctrl+P

- **Print…** stands in the header of the typesetting pane, before *Export*, with a printer icon, and prints the document the pane shows: every page, as set. Where the pages are still being set, it waits for them; where setting failed, the pane's message says so and nothing prints.
- **Ctrl+P**, in a project, prints the document of the side that has the focus: the typesetting pane opens for that side where it is closed, the pages are set, and then printed. In a file side, it prints the file (below). The palette lists *Print* with the key, as it lists every act of the table.
- **The typesetting pane takes Ctrl+T.** Its button, its tooltip, the key sheet and the guide follow the table.

### A file in a view prints

- **Print…**, a printer icon in the bar of a file side after the bookmarks, and **Ctrl+P** while the side has the focus, print a PDF or an image. Since the pages must be drawn before the system's dialog can show, and a scan of three hundred pages takes a minute and much memory to draw, a small dialog of the application's comes first: **Pages to print**, *All (271)* or *From … to …*, the whole file chosen; *Print…* in it draws the pages, with a notice that says how many are being drawn and a *Stop*, and then the system's dialog opens. An image has no such dialog: it is one page.
- The records 0069 and 0072 are amended in this: a file is printed. The owner: a reader printing a few pages of a source is as ordinary as a writer printing a draft.

### What is not done

- No print dialog of the application's own for a document, and no preview of its own: the typesetting pane is the preview, and the dialog is the system's.
- No printing from the files view or the library's pane: a file is printed from its view, where it is seen.
- No handing of a PDF file to CUPS or to the system's PDF program: one way serves all three platforms.
- No printing of the diagram, nor of a map's text as the editor shows it: what prints is what is typeset.
- No choice of resolution for a file's pages.

## Choices made in writing this, which the owner has not been asked about

1. **Ctrl+P** prints and the typesetting pane moves to **Ctrl+T**: the owner agreed that Print should have the key, and T is free and is the pane's first letter.
2. Print in the typesetting pane's header, before *Export*, with an icon and the word; and in the file side's bar as an icon after the bookmarks.
3. **Ctrl+P on a side showing a file prints the file**, not the document of the other side.
4. Print with the pane closed opens it and waits for the pages, rather than setting the document a second time out of sight.
5. The pages go through the window's own webview with a print style, not through a window of their own: a hidden window may not be laid out on Linux, and Windows shows its dialog inside the webview that prints.
6. A file's pages are drawn at 300 dots per inch, the resolution print wants, and the range is asked before drawing.
7. On Linux the paper is set from the document; on macOS the system's default paper is kept and the page fitted into it; nothing is written per platform beyond that.
8. The job is named by the document's or the file's name, where the system names a job by the window's title: the title is set for the moment of printing and put back.

## Why not otherwise

- **Not the PDF to CUPS (`lp`, or a GTK print job with the file)**: vector and exact on Linux and macOS, but Windows has no printing system that takes a PDF, and the gtk crate binds no `PrintJob`; two ways where one serves.
- **Not a window of its own for the pages**: on Linux a window not shown may not be realized, and WebKit may print nothing of it; on Windows the dialog is drawn inside the webview, so the window would have to be shown anyway; the main window's page with a print style is the way every web application prints.
- **Not pages as bitmaps for the document**: the SVG is there, light, and vector; a bitmap would be the typesetting at a screen's resolution.
- **Not a PDF made and handed to the system's viewer**: that is what exists today, and the owner's question.
- **Not inline SVG in the page**: Typst's SVG names its glyphs and clips by ids, which would collide between pages; an `<img>` of each page keeps them apart. Where WebKit is found to draw an `<img>` of SVG as a bitmap into the print, the plan says to inline them with the ids made unique per page instead.
- **Not a resolution to choose for a file**: one number that serves print; the dialog of the system scales to the paper.

## Consequences

- Words in `preview.ftl`, `viewer.ftl` and `keys.ftl`, English and Norwegian: *Print…*, the notices of preparing and of drawing, the small dialog of a file's pages, the key. The key table in `shell/keys.svelte.ts`: `print` with Ctrl+P in the project, `preview` with Ctrl+T. A command `print_pages` in a new `src-tauri/src/commands/printing.rs`, Linux through `webkit2gtk::PrintOperation` with a page setup, elsewhere `Webview::print`; `to_file` for the harness. A core function and command for all the SVG pages of a kept document, without the cap of twelve and without the text runs. `src/lib/print/` for laying the pages into the page and printing them; `PreviewPanel` gains the button and `print()`; `FileSide` and `ViewerBar` the button, the small dialog and `print()`; `ProjectView` the act. The guide's *Typesetting*, *Reading* and *Keys* change; a new `e2e/print.mjs` prints to a PDF file through the hook and inspects it with poppler's tools; `e2e/keys.mjs` and the scripts that press Ctrl+P for the pane change with the table.

## Addendum, 2026-10-30: as built

Built on `main` from 60b72cdf to the commit of this addendum, by one builder, in four stages: a7c157a2 (the way through, the typesetting pane prints), aa6578af (the keys), 6e2cb689 (a file in a view prints), and the guide with this addendum. Nothing is pushed.

**WebKitGTK 2.54 prints.** The first thing tried, before any page was laid: the start screen printed to a PDF through GTK's file printer, one A4 page made by *Skia/PDF m154*, its text as embedded fonts. The pages of a document laid as SVG in `<img>` come out as drawings: `pdfimages` finds no picture in the printed file and `pdffonts` no font, the letters being Typst's outlines. Nothing had to be inlined.

What departs from the plan, or was settled in the building:

- **Each sheet is one point shorter than the paper.** A sheet exactly as tall as the paper spilled a fraction of a point onto a sheet of its own, and every page was followed by an empty one. The pages are centred on their sheets, so a page of the paper's size loses half a point at its head and its foot, in its margins, and is not made smaller. Each picture is sized in the code, at its own size where it fits and fitted where it is larger, rather than by `max-width` in the style.
- **The print command says whether the printing is over** when it returns: on Linux it is, WebKit telling when; elsewhere the dialog was only asked for. The pictures of the pages are the printing's own: it lets go of them when the pages leave the page, on Linux when the command returns, elsewhere at `afterprint` or at the next printing, so that the system never draws from pictures that are gone. The plan had the callers let go of them after the command, which on Windows and macOS would have been too early.
- **The pictures are waited for until loaded, not decoded**: a scan of a hundred pages decoded at once would fill the memory; WebKit decodes each as it prints it.
- **An image prints on the paper the system prints on**, the conventional way of a viewer of images, taken as 300 dots per inch and made smaller only where it is larger than the paper, centred. The record had a paper of the image's own size, which a printer would be asked to load. The paper is GTK's for the locale (`print_paper`, a small command beside `print_pages`); on Windows and macOS, where the page cannot ask, A4.
- **The range of a PDF's pages begins at the page in view**, not at 1, in its *From* field; *All* is chosen. *All { $count }* reads *All 2 pages*, and *The one page* for a file of one.
- **The hooks**: `window.__glaukopisPrint.toFile(path)` set by the typesetting pane, and `window.__glaukopisFilePrint.toFile(path, from, to)` set by a file side, rather than `printToFile` among the viewer's hooks, which are set once by a module and know no side.
- **Print… in the pane's head** is a button of the same make as *Look*, an icon and the word, so that its tooltip can carry the key; the plan's ghost `Button` takes no tooltip.
- **The real dialog is tried after all.** The script presses Ctrl+P with the pane closed: the pane opens, the pages are set, and GTK's dialog opens on the harness's private display, where it is photographed (`e2e/output/print-2-dialog.png`: *Print to File* and *Print to LPR* with its command field, the printers of a machine without CUPS) and closed with Escape. GTK takes no key sent to a window: the dialog is given the focus, and the key pressed on the display.
- **Eighteen scripts and the harness** opened the typesetting pane with Ctrl+P; they press Ctrl+T. So does the test of the keys that pressed it.
- The job is named by the document's name, or the file's, through the page's title, set for the printing and put back after.

Not of this work, found on the way: four checks of `e2e/look.mjs`, on the annotation of a line beside its number in the Typst of the preview and on the page, fail. They fail the same with the package of this morning (0.2.6-7) and the script as it was before printing; they are left as they are.

Not tried, resting on reading alone: Windows, where `window.print()` opens Edge's dialog and the `@page` size of the style should set its paper; macOS, where the print sheet keeps the system's paper and fits the pages into it, and where `afterprint` may never come, so that the pages stay, hidden, until the next printing. Not measured: the memory of printing a scan of hundreds of pages, each held as a PNG of a few megabytes while it prints.

Counts: `pnpm check` without errors or warnings; `pnpm test` 1362; `cargo test --workspace` 983, none failing; `cargo clippy --workspace --all-targets` without warnings. The scripts: `print` 26 of 26, `preview` 48 of 48, `keys` 15 of 15, `what` 38 of 38, `file-view` 52 of 52, `source-tabs` 35 of 35, `viewer-speed` 9 of 9, `languages` 17 of 17; `look` 63 of 67, the four failing before as after.
