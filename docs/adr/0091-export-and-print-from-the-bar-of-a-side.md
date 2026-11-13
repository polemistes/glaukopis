# 0091 — Export and print from the bar of a side

Date: 2026-11-13. Status: built on 2026-11-13, its choices not yet confirmed by the owner; from the owner's words of the same day ("A user has asked if export and print could be reached without opening the typesetting pane."). Amends 0075 (printing: its fourth choice, and *From the typesetting pane, and with Ctrl+P*) and 0064 (the bar of a side).

## Context

- **Export was a button in the head of the typesetting pane and nowhere else**, and **Print…** was beside it. Ctrl+P opened the pane before it printed (0075, its fourth choice: with the pane closed the pane opens and the pages are waited for, "rather than setting the document a second time out of sight"). The pane takes half the window. Someone who writes in the text and only wants the file or the paper has no use for it, and has to open it, wait, and close it again.
- **The bar of a side had Typesetting and Document**, the two panes, and nothing that acted on the document itself. The bar of a file side has its Print (0075).
- **The core keeps a set document for each key**, the pane's under the project's own, and makes any key safe for a folder name; a second key sets a second document and leaves the first where it is. A document that is set and not let go of stays in memory (0087).

## Decision

1. **Two buttons on the bar of a side that shows a project**, after *Typesetting* and before *Document*: **Print…**, the printer, and **Export…**, the share arrow the pane's *Export* has, each with its name as a tooltip and its key (Ctrl+P, Ctrl+E) while the side has the focus. They are always there; they are greyed only while the project has not yet come, as a joined project on its way from the others.
2. **They act on the document of that side**: the element marked as the document where the project has one, else the element in view (0081): the same that the typesetting pane would show for the side.
3. **Printing no longer opens the pane.** Where the pane is open and shows this side, it prints as it did: its pages are made. Otherwise the document is set out of sight under a key of its own (the project's key with `-print` after it), so that what the pane keeps is not replaced; a message says at once that the pages are being set; its pages are fetched, twenty-four at a time, and handed to the page as the pane hands its own; the system's dialog opens. The set document is let go of as soon as its pages are fetched, and again, whatever has happened, when the printing is over or has failed. Where it cannot be set, a message says why and nothing is printed. A second press while one is being set does nothing.
4. **Export opens the dialog of the kinds of file** over the window, for the document of the side, with the pane open or not: the dialog the pane's *Export* opens, with the document made anew when a file is asked for, its name, and the kinds of file its template makes.
5. **Keys.** **Ctrl+P** stays and prints as above; a new **Ctrl+E** exports. Both hold while a side that shows a project has the focus; on a file side Ctrl+P prints the file, as before, and Ctrl+E does nothing. The palette and the sheet of keys list *Export* with its key.
6. **The pane keeps its own two buttons.**
7. **The test hook** `window.__glaukopisPrint.toFile(path)` is set by the view of a project, where it is there whether the pane is open or not, and prints what Ctrl+P prints, to a file, with no dialog.

## Choices made in building this, which the owner has not been asked about

1. **Buttons on the bar rather than entries in a menu.** The bar of a file side has its Print there already, and a button is found without being looked for. The bar wraps to a second row sooner in a narrow side.
2. **Ctrl+E for export.**
3. **Printing with the pane closed sets the document a second time out of sight**, the reverse of the fourth choice of 0075, and lets go of it when its pages are fetched.
4. **The document is let go of when its pages are fetched, not when the printing is over.** The system's dialog may stay open for as long as the writer likes, and what is kept of a book while it stays open is what 0087 counts. The pages are pictures of their own by then, held by the page. It is let go of again in every case at the end, so that a failure anywhere leaves nothing kept.
5. **The keys stand in the tooltips of the side that has the focus**, as the key of *Typesetting* does: they act on the active side, and in the other side's bar they would name a key that prints the other document.
6. **Printing from the bar of a side whose pane is open for the other side sets its document out of sight**, and the pane goes on showing the other. The pane prints only the side it is open for.
7. **The dialog of export is shown once the kinds the template makes are known**, a moment after the press, so that the kinds do not change under the eye; where the template cannot be read, every kind is offered and the dialog says what failed when a file is asked for.
8. **The document is made from its template, layout and styles read first.** A document asked for before the pane was ever open could have chosen its reference style before the layout that brings it was read; the request waits for them.
9. **A document with no pages is not printed, and nothing is said**; it is not known to happen.
10. **No *Stop* in the message that the pages are being set.** Typst cannot be stopped while it sets, and the setting of a book takes seconds, not minutes.
11. **The buttons carry `data-bar-print` and `data-bar-export`**, so that the `data-print` of the pane's head stays the one button of that name for the scripts.

## What is not done

- No *Export…* on the bar of a file side: a file has its own export among the files.
- No choice of pages for a document; the system's dialog has the range.
- No change to the pane's buttons, nor to the key of the pane (Ctrl+T).
- Nothing in the Rust: the core's calls are those the pane makes.

## As built, 2026-11-13

- `print/document.ts`: `printSetPages` fetches the pages of a document the core has set, in batches, and hands them to the page, for the pane and for the new printing both; `printDocument` sets, prints and lets go of out of sight; `printSide` chooses between the pane, which registers itself while it is open (`paneOpened`), and the document out of sight; `requestOf` makes the request. `print/export.svelte.ts` and `print/ExportDocument.svelte` ask for and host the dialog, which `project/ProjectDialogs.svelte` mounts with the view of a project. `project/SideBar.svelte` has the two buttons, `SideView.svelte` gives it the document of its side, `ProjectView.svelte` binds `export`, prints through `printSide` and sets the hook; `preview/PreviewPanel.svelte` prints through `printSetPages` and no longer sets the hook. `shell/keys.svelte.ts` has `export`.
- **Found in building: asked for no pages, the core draws all of them.** The plan had the document set with an empty list of pages. The core takes none named to mean every page, drawn with the runs of its text and sent over, which for a book is tens of megabytes thrown away. The document is asked for a page that no document has (`NO_PAGE`): it is set, the number of its pages comes back, and none is drawn; the pages for the printing are fetched after. What the core also sends, where each element begins and what stands where on every page, it sends to the pane at every setting, and it is sent here too.
- **Where the child that keeps the documents cannot be started**, the core holds one set document in its own process; the one set for printing takes the place of the pane's, which is set again from what was written for it when the pane next asks for pages. Not tried.
- Letting go of a set document does not remove the folder the core set it in, named by the key: `-print` after the project's key is a folder of its own beside the pane's, and stays as the pane's does.
- **Not run**: `cargo` and the scripts were not run by the builder of this part; `e2e/print.mjs` is changed for it (the check that Ctrl+P opens the pane is replaced by one that it prints with the pane staying closed; the pages of a document printed with the pane closed are counted with `pdfinfo` against those the pane printed; the bar's Print… and Ctrl+P open the system's dialog with the pane closed and with it open; the bar's Export… and Ctrl+E open the dialog of the kinds of file; the palette and the sheet of keys have Export with Ctrl+E; Ctrl+E does nothing on a file) and has not been tried.
- **Tests**: `print/document.test.ts`, seventeen, with the core's calls mocked: the batches, the key, the pages asked for, when the document is let go of and that it is, in each way the printing can fail, the notice, a second press, and which of the pane and the document out of sight prints. `pnpm check` has no errors or warnings; `pnpm test` passes all 1461 tests, 1444 before this.
- **Tried in the running application, 2026-11-13, after it was merged.** The script `print` passed as it was changed, 51 of 51: with the pane closed the document is printed to a file with every page the pane printed, and the pane stays closed; Ctrl+P and the bar's *Print…* open the system's dialog with the pane closed and with it open; the bar's *Export…* and Ctrl+E open the dialog of the kinds of file; the palette and the sheet of keys have *Export* with Ctrl+E; Ctrl+E does nothing on a file. The scripts of the parts it touches passed with it: `preview` 48 of 48 and `path` 46 of 46. Seen in the screenshots: with the two buttons the bar of a narrow side wraps to a second row sooner, as with the document pane open in a window 1280 pixels wide, where *Export…* and *Document* stand on the second row.
