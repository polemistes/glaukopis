# 0117 — A document type says what it brings, and Document properties and the template editor explain nothing

Date: 2026-11-22. Status: built on 2026-11-22; holds. From the owner's words of that day (the last section of `docs/brief.md`). Amends 0054 (the chooser of what you are writing) and 0038 (the template editor) in what the writer is shown; follows 0065 and 0066, which took the hints out of the menus, Look and the settings. The model of templates, layouts and styles is not changed.

## Context

- **The descriptions of the types explained.** Each template file had a sentence or two in English: of the plain document, "Text with a title, for anything: what every document is until you say what you are writing"; of a novel, what a novel is. They were written from the conversations in which the types were worked out, and said how the thing was thought of, not what it does. They were kept by hand, so they could be wrong, and they were in English in every language of the interface: a template file has no words of the interface.
- **The tab explained too**: words in the search field of what one may search for, a line under the second step of what it was narrowed to, a line of where the type came from with a sentence of what choosing does, and under the one chosen "Pages as … ; citations in …".
- **"Kind of text"** was said of the types: "Other kinds of text", "a kind of text, a journal, a publisher…". A kind is already a kind of element and a kind of paragraph or words.
- **"Take … again"** stood at the top where the element had chosen a type itself, and took the type of the element over it, or the usual. Where nothing over it chooses, that is what choosing the usual type does, so it read as a second way to the same.
- **The template editor and the other tabs of Document properties** had a hint under most headings.

## Decision

1. **Under the name of a type stands what it brings, worked out from the type** (`src/lib/document/brings.ts`), a line each, things parted by a middle dot, nothing over them and nothing explained:
   - its parts in their order, by their names;
   - the paper, the font with its size, and the line spacing of its layout, or of the writer's usual layout where it brings none; and after them the reference style, where the type or its layout names one;
   - what it requires, where it requires anything: words of text, words of abstract, keywords, and that it is anonymous.

   It is true of every type because it is read from it, a writer's own too, and it is in the language of the interface because it is made of the names the interface has already.
2. **What is said of a type in words is little.** Of the plain document, *Generic text* (`template-described-plain`); of the others that come with the application, nothing: their names say what they are. Of a template of the writer's own, what the writer wrote as its description. The template files that come with the application have no description any more, and the scripts that make and check them ask for none; a template made from one begins with none.
3. **The summaries the core lists carry what the lines are made of**: of a template its layout, its style, its contents and its requirements; of a layout its paper, font, size, line spacing and style. So the tab reads nothing more than the two lists it had.
4. **A document type is not called a kind of text**, in the interface or the guide. The last group is *Other*.
5. **No "take again".** Choosing is the one way to say what a document is. Choosing the type the document has without a word of the element's own, that of the nearest element over it that chooses, or the usual, takes the element's own word away (`typeSaid` in `document/templates.ts`): it is that type by following it, as the button made it. *From …* still says which element a type is taken from, in the two words the details use.
6. **No help texts in Document properties or in the template editor.** Gone: the placeholder of the search; the line under the second step; the hints of the language and of the checklist; in the editor the hints under Contents, Kinds of elements, Kinds of paragraph and words, Requirements and Files, those beside Layout and Reference style, the hints of the kinds of paragraph, the note of a cover, the line that a template with no source follows no publisher's requirements, the line that one's own was changed, the placeholder of the note on the limits, and the sentence in the foot about templates that come with Glaukopis. Kept, since they say what is and not how: where a type's requirements were found; the note of a journal on what its limits count; that a document is anonymous for review; *In the contents* beside a kind whose box cannot be changed; *Kept in the project* of a template the computer has not.
7. **Where a type is from is said only where it is a page one can open.** Under the type in use: *Source:* with its name, which opens the page, and under it when it was read and how sure that is; the type's own source, else that of the layout it brings. The types that are no journal's, publisher's or guide's name as their source how they were thought out ("the order of parts that the journals surveyed agree on"), with no page: that is not shown, there or in the editor of a template. The usual layout's source is not said under a type that brings no layout; it is in Look.

## Choices made in building this, which the owner has not been asked about

1. **Which things are listed** (1): the parts, all of them; of the pages the paper, the font, its size and the line spacing, and no more; the reference style; the limits.
2. **The limits as a name and a number**, *Words of text 12,000*, in the words the editor and Look have for them, so that they are in every language at once.
3. **The usual layout's pages are shown** for a type that brings no layout, without saying that they are the usual.
4. **Choosing the type an element would have anyway makes it follow** (5), so an element cannot be held to the type the one over it has now, whatever that becomes later.
5. **The descriptions are deleted from the template files**, not kept unused; they are in the history.
6. **The second step is narrowed without a word**: under a journal article only what is made for an article is offered, and nothing says that the search finds the others.
7. **The Details tab keeps its placeholders**, on the owner's word that it is fine.
8. **A source in one line** (7), where the tab had the layout's source and then the type's with its address written out, which for a journal are the same.
9. **Generic text in the nine languages offered**, written with the change rather than left for a round, so that the first line of the tab is not English in any of them.
