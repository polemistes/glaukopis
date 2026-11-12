# 0090 — References and citations copied as a reference style writes them

Date: 2026-11-12. Status: built on 2026-11-12, its choices not yet confirmed by the owner; from the owner's words of the same day ("It should be possible to copy both references and citations. References in the default citation style, and citations in the style of the document in which it resides.").

## Context

- **Of a reference, its key and its entry could be copied**: *Copy citation key* and *Copy as BibLaTeX*, in the menu of the library and of its pane. Nothing copied a reference as a reader reads it.
- **A citation was copied as all text is** (0041): as plain text in its Org form, `[cite:@nagy1979 45]`, and as HTML in the neutral short form it is shown with in the text. In neither is it what the document prints, and a citation could only be copied by the keys, selected alone, or with the words around it.
- **The core writes citations and a bibliography in any style already**: for the sample of the style editor it has Pandoc's citeproc write them as HTML (`style_sample`).

## Decision

1. **References are copied as the usual reference style writes them in a bibliography**: the *Default citation style* of the settings, or that of a fresh installation where the settings say none, in the language new texts are given. **Copy** is the first of the copies in the menu of references, in the library, in its pane and in the panel of references of a project, and **Ctrl+C** copies those selected in any list of references. Each is a line, in the order the style puts them in.
2. **A citation is copied as the reference style of its document writes it**, in the document's language, by **Copy the citation** where it is opened, and by **Ctrl+C** when it is selected alone. The document is that of the element the citation stands in, with what it inherits.
3. **As words and as HTML.** The HTML carries only what type can look like: italics, bold, small capitals, raised and lowered letters. That of a citation says which citation it is, as the HTML of copied text does, so that pasted into a text in Glaukopis it is the citation again, and elsewhere its words.
4. **Words copied together with their citations are copied as they were**: Org as plain text, the citations by their keys.

## Choices made in writing this

1. **A citation is written alone, as the first citation of a document is**, not as it stands in its document: the whole note in a style of notes and not *ibid.*, no letter after the year to tell it from another work. What is copied is for use elsewhere, where what stood before it is not; what the document prints at that place is on the typeset page, from which it can be copied. In a style of numbers a citation alone is *[1]*, which is what the style writes and of little use.
2. **A reference in the panel of a project is written in the usual style as well**, not the style of the document in view: the owner's words give references the usual style, and a reference belongs to no document.
3. **In a style of notes with the author named in the sentence**, the name is followed by the note in brackets, as a note is in text that is copied as words. A style without a bibliography writes each reference as it is first cited.
4. **A citation is selected alone by the arrows**, which stop at it on their way through the text; Ctrl+C then takes the key, and the system's own copy does not run. A copy asked of the system's menu is the usual one.
5. **A passage keeps its Org and its neutral forms.** To write its citations in the style, the core must be asked, and the system's copy does not wait. It could be done by taking every Ctrl+C in a text; it was not asked for, and 0041 stands.
6. **A work that neither the library nor the project has** is said to be lacking, and nothing is copied: the style would write a question mark.
7. ***Copied* is said**, as the library's other copies say it; Ctrl+C on a citation says nothing, as copying text says nothing, and where the style cannot write it the citation is copied as all text is.

## As built, 2026-11-12

- **The core**: `style_written` in `export`, beside `style_sample`, the two sharing the run of Pandoc (`written_by`). It takes the id of a style, the works, and a citation or none; a work given by its id alone is the library's. The shell's command of the same name has a lane of its own (`writing`), so that a copy does not wait for a preview that is being made.
- **The interface**: `library/written.ts` reads what Pandoc wrote into words and HTML through a list of what is let through, tested with what Pandoc writes for three kinds of style; `library/copying.ts` has `copyReferences` and `copyCitation`; `Documents.choiceRead` makes the choice of a document's style once its template and layout have been read, which the reactive `choice` leaves for later; the editor's hooks carry `copyCitation`, so that the view of a citation asks the editor it stands in, whose project and element it knows.
- **Found in building, by the script.** The clipboard is asked at once, with what is to be copied promised (`ClipboardItem` with promises), since a web view lets the clipboard be written only while the key or the press is being answered. For Ctrl+C on a citation the system's copy was first let through and written over when the style had written: WebKitGTK refused the writing that waited, the clipboard having changed under it, and the words alone were copied. So the key is taken.
- **WebKit writes styles of its own into the HTML** it puts on the clipboard (colour, size), as it does with all HTML copied from a page; the italics stay as they were given.
- **Not tried**: the web views of Windows and macOS. The calls are the standard ones; where the clipboard will not take words and HTML together, it is given the words.
- **Counts.** Thirteen new tests of the interface, of what is read from what Pandoc wrote, of the clipboard given words and HTML, and of a citation selected alone; all 1444 pass. One new test of the core, of works and a citation in a style of author and year and one of notes, and of a work that is lacking; the 1009 tests of the workspace pass, and clippy is clean. The new script `copying` passes its 17 checks: a reference by Ctrl+C and sixteen by the menu, read back from the clipboard as words and as HTML; a citation as a note in the style a new document has, and as *(Nagy, 1979, p. 45)* once the document is given the style of the APA; Ctrl+C on the citation selected alone, and the citation pasted back as a citation; a passage copied as Org, with nothing written over it afterwards; and a reference copied in the panel of the document, in the usual style. `library` passes 40, `paste` 12, `org` 21, `maps` 81 and `languages` 17.
