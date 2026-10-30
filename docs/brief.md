# The brief

This file holds what the project owner asked for, in their own words. It is the
starting point for everything else. Where this file and `PLAN.md` disagree, this
file wins. Later instructions that settle something are appended at the end, dated.

## 2026-09-27 — the initial description

> I would like you to first plan then develop a standalone Linux desktop application for scholarly work. Its name is Glaukopis. We have previously made an attemt to make this, which I have now archived, so we will start from scratch. Do not look at the old application. Use this promt as the starting point. I think we should use solutions with Rust and Svelte, but please give me advice for the languages and frameworks that will be best to use for this project. Although we mainly aim for the Linux desktop application. It would be a benefit if the application also can be used on Mac and in Windows.
>
> It will be a hub where most of the work with an academic book or article can be conducted. It will promote a reference and idea oriented workflow for research. Most research papers and books start with collecting references along with exploring and developing ideas. The writing process is subordinated under these two processes, and although text is produced from the start, the main output which will be published is normally not produced until the reference and idea stage has become mature. The application should be useful for researchers of all academic fields, but if there are conflicting concerns, scholars and researchers of humanities are the primary audience, and social sciences second.
>
> There are five main parts to the application, which need to seamlessly work together within each project and accross projects:
>
> 1) A mindmap with two kinds of links, hierarchical and associative. Each element can contain text and citations. Citations are references that may contain page numbers, prefixes and suffixes. The mindmap display has two modes. One is the graphical diagram where each element is placed on a canvas with lines showing the links. Straight lines for hierarchical links and curved for associative links. Element text is shown in a tooltip when hovering. Double-clicking the element opens an edit box, for entering and editing its text. The second mode is a structured text, with the names of the elements as section headings. The hierarchical links are shown by the structure itself, the associative links should be shown with narrow lines in the right border of the text.
>
> 2) A reference framework. References will be stored in a biblatex file. It should be possible to import .bib files and zotero repositories. There should also be a way of importing citation data for books and articles from external databases, if they allow this and are reliable. It should be possible to import pdfs of books and articles etc. for references. Everything loaded into the application should be stored in the application's own store, and not be linked to the files that have been imported. There should be a sound system for avoiding duplications. References are registered universaly for all projects, but there can be made collections of references, where the added references are just links of the ones in the main repository, so changing one changes all. References and collections of references can also be added to projects, and to elements in the mind map.
>
>    Adding new references and editing references should be streamlined and simple, with a form with the common fields available from the start, according to publication type, and other fields easily available from a menu. It should be possible to edit the .bib file entry manually, but this should be a rare need, and the not shown prominently in the edit form. Adding, editing and importing references should be available at all relevant places in the application where references are used. In the text editor and the mind map editor as well as the reference mangement.
>
> 3) The document editor. This is perhaps one of the most tricky things to get right for this application. Ideally the user should feel that the process of writing the academic work is, to make the mind map of ideas while collecting references to literature and putting text into the structure. After that, what is left is to rearrange and edit the texts written during the first part, and just add some text to solidify things. This will normally not be the case. The academic will probably need to make more than one mind map for each project, with much overlapping content and text written several times. We cannot and should not control the researcher's process, only suggest (not verbally, by the functionality of the application) a reference and idea oriented process, as mentioned.
>
>    The normal workflow, anyway, as I predict, is that the user chooses the most complete mindmap and section, and just copies whatever is missing from the other maps, rearranges and edits things, until the finished document appears. One problem with this is that the initial mind maps may be valuable in themselves and perhaps the most valuable of them will be reduced into the final document. An easy way for the user to avoid this, is of course to start a fresh map to make the final document inside, perhaps just copying the best of the already present mind maps. Also for books, the workflow may be that there is a mind map for the whole book as well as separate maps for each chapter, or evan for different themes spanning the book. All of this is probably something the academic writer will be able to collect and keep in order somehow, but when planning the application, we should think of how we can make this process as streamlined, intuitive and simple as possible.
>
> 4) The preview and export of documents.
>
>    The document should have export options for Latex, odf and docx at least. It should be possible to see a preview of the document at all times, but it should also be hidden when not needed. All the standard and common reference styles should be available. We should also offer a reference style editor, where standard styles can easlily be altered to reflect idiosyncratic requirements of some publishers.
>
>    In additon to reference styles, publications have specific requirements for the formatting of documents. When you develop the application, you should look up the requirements for the most well known publications and offer these as default options. It should be possible to edit all the parameters of these defaults, in an easy to use interface.
>
> 5) Online collaborative documents. The application should work fine as a standalone program on one desktop computer. But we should offer a simple server program which can establish colaborative connections of projects. To share editing privileges with other users, the project author and owner has to enter the url of the server, which will make it possible for simultaneous editing. The owner of the project will send a code to the collaborators, who, after adding the same server url, will be able to edit the project.
>
> Lastly, some general project goals:
>
> 1) Simplicity. Do not show the user functionality until it is needed. When needed it should be there almost without any thought.
> 2) Intuitiveness. The functionality should appear in the way users would expect, where expected and when expected.
> 3) Attractiveness. An elegeant, but still simple, user interface is one of the most important features of an app that has a goal to incite academic creativity.

## 2026-09-27 — after the first look at the application

> When I look at it now, I think the assosiative links in text mode should be on the left side. When writing text, I am not sure how to add citations to references in the text itself. Also formating and styles should be easier to make. I notice that standard key-codes work like ctrl-b for bold, but There should be some tool for it. How is the text itself stored now? Markdown could be a good option, if you don't see limitations with that. But I really like the way the editor feels now, so do not make big changes to that.

What this settles:

- In the text, associations are drawn in the **left** margin. This replaces "in the right border of the text" in the initial description.
- Citing, the marks and the kinds of paragraph have tools that are in view while writing, besides the keys.
- The editor is to keep the feel it has.

Earlier the same day: commits are made when a piece of work is whole, without asking; packages are made for Arch Linux only, for now.

## 2026-09-28 — three simplifications

> If we are not using Markdown as the main format, we do not need to write Markdown either. I think adding references to the map elements just creates complexity. Just let any reference added in a text add it to the project and the relevant map. When previewing now, it seems the display is redrawing the view every second or something. Is it not sufficient to redraw it when something changes?

Asked which Markdown was meant, the files beside the projects or the signs typed in the editor, the answer was: both.

What this settles:

- No Markdown copies of maps are written. Markdown remains as one of the formats a document can be exported to.
- Signs such as `*so*` are not turned into italics as they are typed.
- References are not attached to elements. A reference belongs to a map and to the project by being cited in a text. This replaces "References and collections of references can also be added to projects, and to elements in the mind map" in the initial description.
- The preview is drawn again when the document changes, and not otherwise.

## 2026-09-28 — after some use

> How is the pdf review/export made? The interface is nice, but I think perhaps it should be possible to change the size of the different views, if it is not mess up anything else. We were talking about seeing two trees side by side either in text or diagram mode. The note button in the text editor opens a dialog, but it immediately before it is possible to write anything. Using the shortcut key works fine. The numbering of the notes should be per map, not per section when in text mode. In diagram mode I am not sure. Perhpas numbering per element makes sense there. One question about the notes. Are there any styles where some notes should be footnotes and others endnotes. In that case, it should be possible to override the style default. The preview has a warning icon at the bottom. It says "1 remark", and is about a missing font, which is fine. The problem is that the message does not fit the message box appearing when I click the remark icon, and there is no way of seeing the rest of the warning text. Another feature we need is a system for writing text attached to references. This is the user's reflections and comments about the source, and not necessarily something that will be used in the document. But it should be viewable wherever the reference is shown, either as a choice to add or in a text, or in the lists of bibliography. I think, in the lists of references in the project as well as the library, it should be easy to read the note already pertaining to each reference, but only by clicking an icon. And then it should also be easy to edit it. But even when searching and adding citations in the text, the notes should be viewable and writable. There should be two kinds of notes, local to the project and global, which will appear in all projects. When writing notes in the library, it will become global automatically, of course, but in other cases, the note will be local by default, but the one writing it or editing it can make it global. When one joins someone else's project, all the notes coming with the project's references will be local by default, even if they are global in the source project. There is a bug in the edit reference window that appears when double clicking a reference in the project references. When clicking the add field button, the field menu appears behind the edit reference window and is difficult to reach. This also happens with the New Reference window.

What this settles:

- The parts of the project view can be given more room or less.
- Notes are numbered through the map in the text, and within the element in the box of the diagram.
- A single note can be set to stand elsewhere than the format has its notes.
- Notes on references, of two kinds, as described (docs/adr/0008).

## 2026-09-28 — new features

> Great! Now for new features! I think it would be a good idea to be able to export a pdf based on LateX. And we should also be able to add images, figures and equations. These should be part of elements and the text, of course, and they should be part of the preview and export, formated as the reference style or the format requires, or as the author requests. I am not sure exactly how this should be handled, but please suggest what you think.

What was suggested, and built as a suggestion that can be changed (docs/adr/0009):

- A PDF that is set by LaTeX, beside the one that is set by Typst.
- Pictures as figures in the text, with what is said of them; kept with the project, and sent between those who share it.
- Mathematics in the notation of TeX, in the line and on a line of its own.
- The document format says how figures and the numbers of equations are set; the author says how wide a figure is and whether it is numbered.
- Not yet: tables, and pointing to a figure or an equation by its number.


## 2026-09-28 — a store of pictures, and cross-references

> We do not want to connect to Google drive. There should be a store of pictures, which can be seen per map, per project or all pictures in the application, somehow like references. It should be possible to add default captions, as well as notes, like in references, which will not be shown. Why does the figure not arrive with the picture? All projects and maps using an imported picure, should share the same in the picture store. And yes, what do you mean with "figure" then? We do need to be able to refer to the insertions, as well as create cross references in the document.

What this settles:

- Pictures are kept in one store for the whole application, as references are in the library, and not in each project. Every project and map that uses a picture uses the one in the store. This replaces the first form of the feature, in which each project kept its own.
- The store can be looked at for the map, for the project, and whole.
- A picture has a caption that is given to a figure made with it, and notes, which are not part of any document.
- What stands in the text by itself, figures and equations, can be referred to from the text, and so can the parts of the document.
- Nothing connects to services outside, such as Google Drive.

Words: a *picture* is the file; a *figure* is a picture as it stands in a text, with what is said of it there and its number in the document.

## 2026-09-28 — tables, documents brought in, and where things stand on the page

> Yes, there should be a tables feaure. I think we should have an import feature for tables, csv, ods and Excel, perhaps. Let us also have a document import from odt, docx and  markdown, as well as other relevant formats. These should be imported as their own maps. Also, figures and equations are now centered on the page. It should be possible to choose orientation and whether text flows around the image or not. The default should be whatever the reference style or format says, if anything. The same goes for tables. It should be possible to have more than one figure, table or equation beside each other. One thing to fix somehow. When resizing a figure, the whole display moves because the picture changes size, while the mouse click is still on the resize bar, which then is moved rapidly to max or min, so it is difficult to actually set the size with the bar.

What this settles:

- There are tables, which can be written, and brought in from CSV, ODS and Excel.
- A document can be brought in from ODT, DOCX, Markdown and other formats, and becomes a map of its own.
- Figures, equations and tables stand to the left, in the middle or to the right, and text may flow around a figure or a table. What the format says holds until the writer says otherwise.
- Several figures, tables or equations can stand beside each other.
- The width of a figure must be settable without what is shown moving under the pointer.

## 2026-09-28 — the icon, and parts of the text that can be folded

> Letting a AI model code for me is fine, but it is not ok to use AI to make art. So I have made a new icon for the appliction. You can find it here: /home/proteus/glaukopis-logo/glaukopis-logo.png . Please use this instead. It is not finished yet, but it will do for now. An then, a new feature: Collapsible elements in text view. Let it be possible to collapse sub-elements under an element. Remember the collaps state of the elements being colapsed, but let there be a simple way to open all collapsed elements under an element.

What this settles:

- Nothing that is drawn is made by a machine. The icon of the application is the owl its author has drawn, and replaces the mark that was there; it is not finished, and will be replaced by the author.
- In the text, what stands under an element can be folded away, and is as it was left when the text is opened again.
- All that is folded under an element can be opened at once.

## 2026-09-28 — folding takes the text as well, the licence of the owl, and citations brought in

> I think the text of the folded element should also be folded. There seems to be a small bug. The top element can be folded, but not the first sub-element, while the sub-sub-element can be folded. When the application is released, it will be under the GPL-3 license. The logo is based on a picture I found online, which is under the Creative Commons Attribution-Share Alike 3.0 Unported, so my drawing needs to have the same license. The original is found here: https://commons.wikimedia.org/wiki/File:SNGCop_039.jpg. When that is done, we can go on with a more complex task: Citation import from files. I do not know how complex of an import we should have, but we should have one. For example, if a word or odt document has references made by Zotero, and these referenes have been imported, it should not be too difficult to implement. I suggest that we have an import citations window, which optionally opens when importing external texts, and can be opened for any map. It will try to detect the citations in the document, and provide suggested citations from the library, or if it cannot find anything, let the user search and enter the citation herself, as when adding citations normally. The suggested citations should be presented as a list, which the user can go through and deal with one after the other, with the option to dismiss it, accept the suggestion or edit the citation. Apart from zotero links in word or libreoffice files, pure text formats, like org, markdown or latex can have tags with references. These should be detected, but can perhaps not be guessed, but the user will probably be able to add the citation easily based on the tag name, and pick the right reference from the library. One challenge is that the different citation styles promote different forms of citations. In Chicago note styles and other styles with foot/endnotes, many texts write extensive prose incorporating the citations in the foot/endnote, where the prose resides in the prefix and suffix of a multi citation note. Most other citation styles have just the author and date in a parenthesis in the text, and almost never include any prose. This is put in a note by itself or, more often, is kept as part of the running text itself. It is unrealistic that the citation import will be able to handle all, or even most cases. Still I think it should be implemented, especially since many documents will have zotero citations which can be detected and imported directly. I suggest that the importer will have an option to automatically import recognized zotero citations, meaning citations of references in the library that have been imported by Zotero. If not in the library, zotero citations must also be part of the list of detected citations, and the user will deal with its suggestion as all others. There should be an option to assume that paranteces with years inside are citations and an option to assume that all footnotes have references inside. For citations in notes, it should be possible to choose whether this will be transformed into a citation, which will be inline or a note according to the reference style, or keep it in the note. Exactly how to help the user transform the text into a citation, I am not sure, but hope you have a good suggestion.

What this settles:

- An element that is folded has its own text folded away as well, and shows its name.
- The application will be released under the GPL, version 3. The drawing of the owl is made after a picture that is under Creative Commons Attribution-Share Alike 3.0 Unported (https://commons.wikimedia.org/wiki/File:SNGCop_039.jpg), and has that licence itself.
- Citations are brought in from texts that were written elsewhere. There is a window for it, which may open when a text is brought in, and can be opened for any map. It finds what may be citations, proposes references of the library for them, and lets the writer go through them one after the other: accept what is proposed, change it, or leave the text as it is. Where nothing is proposed, the writer searches as when citing.
- What is found: citations made by Zotero in Word and LibreOffice files; tags in Markdown, Org, LaTeX and their like; and, where the writer says so, parentheses with a year in them, and notes.
- Citations by Zotero of works that are in the library and came there from Zotero can be brought in without asking.
- Of a citation in a note the writer chooses whether it becomes a citation, which the reference style sets in the line or in a note, or stays in its note.

## 2026-09-28 — the citation box, the arrows, and a large document that lags

> This looks quite good. A couple of things: When opening a citation window from the text, there is a close window symbol in the corner of each citation in the note. This deletes the citation. The delete citation button should be placed elsewhere and have a more idiomatic symbol for delete. When moving around in the text with the arrow keys, the citation edit box opens when the cursor traverses the citation note. It should only select it and open on pressing enter, so it is possible to move around in the text without opening the citation window. I am quite sure there has been some kind of regression after the last pass or so. I imported a huge document with more then 100 000 words. When I first opened it, I noticed no lag, only the first time the preview was made. Writing in the text was reflected in the preview as I wrote without much delay, and I noteced no lag in the typing at all. Now the whole system becomes lagging, even without the preview open. Could you see if I am right, and in any case see if it is possible to make it less laggy to work with a large document?

What this settles:

- What takes a work out of a citation is not a cross in the corner, which reads as closing, but a sign that reads as taking away, in another place.
- The arrows go through a citation in the text without opening its box: it is selected, and Enter opens it.
- A document of more than a hundred thousand words is to be written in without lag, with the preview closed and with it open.

## 2026-09-28 — on GitHub, and Windows and macOS

> How difficult is it to make windows and mac packages of this now? Could you push this to github in the polemistes/glaukopis. Wipe the previous version residing there completely first, so nothing form that intrude into this version.

> I moved the old glaukopis repo away and created a new one. I really don't want you to get infected by any of that code.  So now it is just to push it to polemistes/glaukopis.

> Using WebView2 on windows, will it be in conflict with the GPL-3 license. Is there an open source alternative on windows? I would not like to distribute a program that depends on closed source programs.

> No, I just prefer not depending on more closed-source parts than necessary. Of course running on Windows and Mac will depend on closed source parts, as does running on Linux on machiens with closed source bios and hardware firmware everywhere. So, no worries. In the future when Servo is mature, we might change, but until then, we stay the course. We are not building any windows of mac installs yet.

What this settles:

- The code is at github.com/polemistes/glaukopis, a repository made new for it. The repository of the first attempt was moved away, and nothing of it is to be looked at.
- No closed parts are depended on beyond what is necessary. What a system itself brings, such as the web view of Windows or macOS, is acceptable.
- Installers for Windows and macOS are not built yet.
- When Servo, an open web engine, is mature enough to run the application, it may take the place of the web views of the systems.

## 2026-09-28 — search, OCR, spelling, and languages

> Now I will describe four new major features we should implement. The first is search and replace functions. The editors that may edit a considerable amount of text, such as the map text editor and each editor of elements in the diagram view, should have search, as well as search and replace functions. For search, there should be an option whether or not to include citations, and all other labels outside the text itself. This should obviously not be an option for replace. Another option is to search only within the selected text. There should also be a system wide search function, with the option to search only one project or all projects. No search and replace for this, I think. An option to search content outside the texts themselves should also be here. Next, I really would like include an ocr function for pdfs and images. For pdfs, the text could either be extracted or be embedded into the pdf, like the app pdfsandwich does. Feel free to look at that, or if you know of better cross platform solutions, do what you think is best. I think Tesseract is the best open source ocr engine around for all platforms. Third, we should also implement spell checking. Unless you know of some viable and well functioning open source solution for grammar that I have not heard about, we will not offer grammer checks. I am not sure what open source spell check solution is best, so feel free to suggest. Last, the program should have localization features, both for the interface and the documents. The interface and text languages should be the language of system locale by default, or English if that is not available. The user can change language manually also. For now, let us implement Norsk bokmål in addition to English.

What this settles:

- The editors where much is written, the text of a map and the edit box of an element in the diagram, can search, and search and replace. A search can take in the citations and the other labels that stand outside the text itself; a replace cannot. Both can be kept to the selected text.
- There is a search through everything, in one project or in all, without replacing, which can take in what stands outside the texts.
- Text is read from PDFs and pictures by OCR, with Tesseract. The text of a PDF is either taken out of it, or laid into it unseen under its pages, so that the PDF can be searched and its text copied.
- Spelling is checked as one writes. Grammar is not, unless a free checker is found that works well.
- The interface and the texts have a language. Both are that of the system where the application has it, and English where it does not, and both can be changed. The interface is in English and in Norwegian Bokmål.

## 2026-09-29 — installers for Windows and macOS

> Could you build the windows and mac versions now?

Asked whether they should be built on GitHub's machines, which means pushing the work there, the answer was yes.

What this settles:

- Installers for Windows and macOS are made, on GitHub's machines, by `.github/workflows/installers.yml`. They carry Pandoc, Typst and Tesseract with them. They are not signed.

## 2026-09-29 — the full history of a project, and reviewing changes

> How complex would it be to implement optional document history for a project on a quite detailed level? Also, perhaps related, how hard would it be to make a track changes system, where changes are tagged with the author and we have a way to either accept or discard changes?

Two ways of tracking changes were set out: proposals held back until they are accepted, as in Word and LibreOffice, and changes that are made at once and reviewed afterwards, which the history makes possible.

> In 2. Reviewing changes afterwards, how fine grained should each change that the user have to accept or reject be? Each character would be meaningless, as would each word, unless just a character or word was changed.

> Let us go for the optional full history. It should be optional. Could a way to deal with the disk space and history load time be to let the user archive or delete older history? Making older history less fine grained is also an option, perhaps. Let us also go for  2. Reviewing changes afterwards. It seems almost as convenient as the word and libreoffice track changes function. Two concerns. How will it look if a sentence or paragraph has changed many times between the present state and the state compared to? Will the full history be shown or just the to endpoints? Endpoints should be default, I guess, but perhaps it should be possible to see the full history as an option, and accept another point than the present one? And I think it should be possible in the review process for the reviewer to edit the text he is reviewing, and either accept it or defer it for later review (I mean just go on to the next change).

What this settles:

- A project can keep its full history: every change, with who made it and when. It is optional, for each project.
- Older history can be kept less finely, archived, or deleted, so that it takes neither too much room nor too long to read.
- Changes are reviewed afterwards. What others have changed since a moment is gone through, change by change, and each is accepted, rejected, or left for later. A change is a sentence, with the words that changed marked in it; or more, where more changed together: a paragraph written or deleted, a paragraph moved, an element added, moved or deleted.
- A change is shown from the text as it was at the moment compared to, to the text as it is. What happened in between can be shown as well, and a version in between can be accepted instead.
- The reviewer can change the text while reviewing, and then accept it as it stands, or go on to the next change and leave this one for later.
- Proposals held back until accepted, as in Word and LibreOffice, are not built now. Pandoc reads and writes them in DOCX only; ODT would need the application's own reading and writing.

## 2026-09-30 — Nynorsk, and the installers

> I am guessing a reboot and the update of the code plugin might fix the problem. Wait with the installers now. Remeove the worktrees. Bokmål for now. We will make Nynorsk later.

What this settles:

- A computer set to Nynorsk is spoken to in Bokmål, as ADR 0020 has it, until the interface is in Nynorsk as well, which is to come.
- The installers for Windows and macOS are not made again for now.

## 2026-10-01 — the writing tools and the formats, thought through anew

> For the Glaukopis system, we need to make a full rethinking and redesign of the writing tools as well as the format and styling system. Let us "invent the wheel" again for this, and perhaps end up with a very similar wheel as the one used for Word or Writer, but perhaps also not. Now the formatting tools in the writing toolbar seem quite arbitrarily chosen. Of course bold and italic etc. are very common tools, but we do want to provide a wider range than the one available now, I think. I would like you to think hard on this, and give suggestions. This is of course connected to the different needs of writers of different kinds of texts. As I have mentioned, I do not think we should have different types of projects or maps. The different choices for different types of texts should be readily available, but easily configured. Choices made on behalf of the one writing should be taken for her convinience, but should should not feel enforced or be felt to assume too much. The difficult balance is to let the styles, formats and writing tools of passages of text, elements and whole maps, that is documents, work seamlessly and intuitively together, providing the settings and tools needed, without persuming too much and without getting in the way, and in a configurable way. I was also concerned to hear that the text styles as they work now are not exported to word and writer documents, only the names of the styles. It is a goal that the documents created in Galukopis should be exported quite well to the main document formats, but how well is of course something to weigh against the usability, versatilitiy, power and intuitivity of the user interface of Glaukopis itself. Could you please think closely on solutions for this, and provide suggestions for how this reworking could be done? Just suggestions now, please. We will decide what to do afterwards.

What was suggested, in short: a passage has a *kind*, which is a meaning
and not a look; the look of every kind lives in the format, as a row of a
table, and never in the text; a kind is a delta on the kind it is based
on, so that a writer's own kind works in every format; there is no bucket
of direct formatting, only a few adjustments a style guide asks for; the
kind menu shows the kinds in hand and learns from use; each kind says what
Enter makes next; a strip says where a look comes from; every kind becomes
a defined style in Word and Writer; and styles are mapped back to kinds
when a document is brought in. Four decisions were put to the owner: no
direct formatting at all; a writer's own kinds kept in the project; the
editor staying neutral paper; and italic staying one mark, which a
manuscript format may set as underline.

> I like your suggestions, and let's follow your recommendations for the decisions too.

What this settles (docs/adr/0029):

- The kinds of paragraph and of words are a catalogue, grouped, and a
  writer may make kinds of her own, based on another kind; they are kept
  in the project, as the kinds of elements are, and are offered by name
  across projects.
- The format has a look for every kind, and a kind of the writer's own
  carries its differences from the kind it is based on. There is no
  direct formatting: no font, size or colour in the tools. A few
  adjustments stay: centred, a new page before, kept together, the
  language of a passage.
- The tools show the kinds in hand: the plain ones, those the map uses,
  those pinned, and those the format suggests. The whole catalogue is
  under "More…", with "Make a kind…" at its foot.
- A kind says what Enter makes next, and Tab cycles within its group.
- Every kind, built in or the writer's own, is a defined paragraph or
  character style in Word and Writer, made from the format; adjustments
  become derived styles. The same table drives Typst, LaTeX and the
  e-book.
- Italic stays one mark; a format may say that italics are set as
  underline.
- The editor stays neutral paper; each kind has a screen look of its
  own, derived from the kind it is based on.

## 2026-10-01 — the timeline: nothing without a time, and a margin either side

> In timeline view, exclude elements with no time assigned. A point time can optionally have a span of +/- time which will be shown with a fading span both ways from the point in time.

What this settles:

- A lane is shown only when its element, or something in its branch, says
  when it is; what says nothing of its time is not in the timeline.
- A written time, of a point or of either end of a span, may have a margin
  either side: a length of time (`5 years`, `3 months`, `10 days`, or a
  number of the timeline's units), drawn as a band fading away on both
  sides of the time. What is placed relative to it may be anywhere within
  the margin.

## 2026-10-01 — what comes with the application, and what comes from the system

> the dictionaries both for spelling and tesseract should be optional packages for Linux. For Windows and Mac do what is best for those platforms.

Asked earlier why the fonts that come with Typst were bundled rather than
installed as dependencies, the answer agreed on was that Typst stays
compiled in (ADR 0023), for the speed of the preview, but its fonts come
from packages on Linux.

What this settles:

- On Arch Linux the dictionaries of spelling are packages of their own,
  `glaukopis-dictionaries-en`, `-nb` and `-nn`, and optional; the
  dictionaries of Hunspell that the system has serve as well. Tesseract is
  optional too, with the data of its languages.
- The fonts that come with Typst are a feature of the build,
  `embedded-fonts`, on by default and off in the package for Arch, which
  depends on `otf-libertinus` and offers `ttf-dejavu` and
  `otf-latin-modern` instead.
- The installers for Windows and macOS bring everything, since those systems
  have no packages to lean on: Pandoc, Tesseract with its data, the
  dictionaries, and the fonts compiled in.

## 2026-10-01 — the Norwegian dictionaries, made from the word lists of Bokmålsordboka and Nynorskordboka

> No build the packages. They should be bundled with windows and mac.

Asked whether the Norwegian dictionaries should go on being LibreOffice's,
with a second list beside each for the compounding and the genitive, or be
made anew from the official word lists of Bokmålsordboka and Nynorskordboka
that the University of Bergen publishes, the answer was to make them.

What this settles:

- The Norwegian word lists, `nb_NO.dic` and `nn_NO.dic`, are made by
  `scripts/make-norwegian-dictionaries.py` from `lemma_expanded.json` of
  each language at ord.uib.no: every form of every word, with the flags of
  compounding and of the genitive given by word class. The rules of
  spell-norwegian stay as they are. The extra lists are gone.
- The words are under CC BY 4.0, to be named as *Bokmålsordboka/Nynorskordboka,
  Universitetet i Bergen og Språkrådet, ordbøkene.no, CC-BY 4.0*; the
  inflections are those of Norsk ordbank (Nasjonalbiblioteket, CC BY 4.0);
  the rules are GPL-2. The packages for Arch say so, and the guide names
  the source under *Spelling*.
- On Windows and macOS the dictionaries are bundled with the application,
  as everything in `resources/` is; on Arch Linux they stay packages of
  their own.

## 2026-10-04 — after trying it: eleven proposals

> I have tested it and have some proposals for enhancing it: 1) In zotero etc. import, have an option to switch all the same quetions into the same answer, such as if it is the same book or not. 2) When importing from Zotero, and asking to make all the Zotero citations automatically, it does not do so, it seems. 3) Make it possible to do the check for citations that now happens when importing a document also after the text is imported, even if it is not imported. 4) When going through duplications in the reference library, the note says two works have the same title, author and year, even when this is not true. […] 5) When an element that has a time range has subelements, the subelements should be shown under that element in the time, and not anywhere, or am I misunderstanding the logic? 6) Make text windows in the diagram mode movable. 7) Language settings per map and project. 8) Turn on/off autospellcheck in the toolbar, or at least somewhere easily reached when writing. 9) Keep linebreaks when importing textfiles. 10) In text mode, it is not intuitive how to add new headings (elements). Is it a good idea to adopt the orgmode keyboard shortcuts? 10) Could we have the citation converting in a panel instead of a separate window when going through the citations of an imported document? Then the passage in with the citation could be shown in context in the text view (and perhaps the preview) view if open.

What this settles:

- An import answers for all candidates in the same case at once, by a row
  at its head for each certainty; each can still be answered on its own.
- "Make citations at once" was failing for want of the keys of Zotero's
  items on the references: the library now learns them wherever they are
  said for certain (ADR 0015, addendum).
- The citations that were found are gone through in the panel at the side,
  for any map, with the passage shown in the text beside it; the preview is
  left for later.
- The reason two references are taken for one says what actually agreed.
- An element without a time, under one that has one, is within that one's
  time: drawn there, faint and dashed, until the writer says when it is.
- The box in which an element's text is written in the diagram is dragged
  by its header, and the next opens where it was put.
- A map's language and a project's language for new maps are set under
  **Languages…** in the map's menu; foreign words are checked in their own
  language.
- Spelling is turned off and on from the writing tools.
- Lines of a text file stay lines of their paragraph.
- Org mode's keys are taken as additions: Alt+Enter, Alt+Shift+Enter, Alt
  and the arrows; Ctrl+Enter, Tab and Alt+Shift stay; a **New element**
  button stands first in the writing tools.

## 2026-10-05 — many projects, the library sifted, the settings a window

> The project page will be messy after tens if not hundres of projects have been started. In addition to the veiw of the last used projects, that can be similar to now, there should also be a more compact list of projects, where they can be placed in "folders". An option that we almost have to include, then, although it probably will not be much used, is to turn the tree of projects into a new tree, either with the whole hierarchy beneath each project intact, or with just the titles of the folders and the projects inside them. In the library, it should be possible to filter on type of citation (book, article etc.), publisher and publication date. It should be possible to make a tree of the publication list or a set of collections. So subcollections should be possible. There is a tiny bug in the interface and font size selector, where the colour of the line behind the knob does not exactly align with the knob when moving it. The user settings should be a window, so we come back to where we were after changing them. The only thing pressing shift does now is to disconnect all the element's subelements and connect them to the moved element's parent. Movement should not do anything other than move the element. The only excelption is when moving one element into another. The element that is moved should be a bit more transparent, so it is possible to see when it is exactly over another element and will be moved there. This is now difficult for elements with names that span several lines. And, when creating a new project or map, open it the first time in text view. Build the package when you are ready.

What this settles:

- The page of projects has two forms, remembered: the last used as cards,
  and all projects as a compact list in folders that nest. The folders are
  kept on this computer, not in the projects (ADR 0031). **A map of the
  projects…** makes a new project of them: the folders and projects by
  name, or everything in them, maps and elements copied as they are.
- The library is sifted by kind of work, publisher and year, from a filter
  at its head; collections lie within collections; and a collection, or the
  whole library, can be made a map in a new project.
- The filled part of a slider ends under its knob: both are measured over
  the track less the knob's width.
- The settings are a window over whatever is in view, from the gear in the
  rail or Ctrl+,; closed, they leave the view as it was. The old place,
  `#/settings`, opens the window over the projects.
- Dragging an element with Shift moves it without moving its subelements,
  which stay where they stood and stay its own; nothing is ever disconnected
  by a drag. Dropped onto another element, it goes under that one with all
  that is under it, Shift or not. (Read twice wrongly the same day, as
  letting the subelements go to the old parent; put right the third time,
  before the packages were tried.) The element dragged is seen through, and
  the element it would go into is ringed plainly.
- A new project or map opens on its text the first time.
- The text drawn without an editor takes away marks it did not make: WebKit
  gives a text set again by `innerHTML` the nodes it parsed before, marks
  and all.

## 2026-10-05 — which map the panel at the side is about

> In the side pane, the information is usually connected to a map. It is possible to have two maps open at the same time, and the information pertains to the view that is active, which is shown by highlighting the head of the active side of the split screen. But there should be some indication in the side pane as well of which map the information is about. Also, when clicking the changes tab, the active view changes into text mode. I am not sure if that is necessary.

What this settles:

- The panel at the side names its map in a line over its tabs; with two
  maps side by side the line is marked as the head of the pane in view is.
  The history, which is of the whole project, has no such line.
- Opening the changes leaves the view as it is. Going on to a change from
  the panel turns the pane of its map to the text, where the changes are
  shown.

## 2026-10-05 — the first release, to test

> I am putting out the packages for people to test now. [...] I would also like to put the PKGBUILD out, but it should then take the code from github. We should perhaps make this a release?

What this settles:

- Version 0.1.0 is tagged `v0.1.0` on the commit that was tested, and is a
  pre-release on GitHub with the Arch packages, the installers for Windows
  and macOS and their checksums, the same files as on the page of packages
  put out for testing (`packaging/web`).
- `packaging/arch/release/PKGBUILD` builds from the archive of the release,
  with its checksum; it is the PKGBUILD to publish. The one beside it goes
  on building from the tree. Neither goes to the AUR yet.
- A deb and an rpm, for Ubuntu 24.04 and Debian 13 or newer and for Fedora
  40 or newer, are made by the installers workflow beside the installers,
  on an Ubuntu runner, and are in the release. They bring Pandoc along, since
  the Pandoc of Debian and Ubuntu is older than the application asks for,
  and recommend Tesseract from the system's packages, which has it as new as
  any. Flatpak, which would reach every distribution with one build, waits.

## 2026-10-06 — the languages of the interface, and how the languages of spelling and OCR are to come

> Now, we are not really satisfied with the number of interface languages. We want Nynorsk, Swedish, Danish, Finish, Icelandic, if you are able to translate reliably into the Samic languages and Kvensk, that would be great, German, French, Dutch, Spanish, Italian, Greek, Polish, Ukrainian, Czech, Slovakian, Slovenian, Bosnian, Serbian, Croatian, Romanian, Albanian, Turkish, Belarusian, Russian, Chinese, Japanese, Hindi and other large indian languages, Portugese. That is for a start. I think what makes sense is to make a system for importing spelling languages and ocr languages, instead of bundling or making our own packages. On Linux the system Hunspell or Tesseract languages would work, but imported packages take precedense. We could import from official hunspell or tesseract archives, or store them on our own server, where we can control their content and stability. [...]

> Ok, do all the interface translations in the two first groups, so include the group with Finnish and Icelandic, but not the ones worse than that. Let us do the spelling and ocr when that is done.

What this settles:

- The interface is translated into the languages asked for, by a language
  model under rules and checks (ADR 0020, addendum of 2026-10-06): one
  agent for each language, a glossary of the application's words, a check
  of names, variables and plural forms. Portuguese comes in both standards,
  Serbian in both scripts, Chinese simplified and traditional. English and
  Bokmål are the only languages that must be complete. The Sámi languages
  and Kven, the Indian languages beyond Hindi, Marathi, Bengali, Gujarati,
  Tamil and Telugu, and the languages written from right to left wait: the
  first for a reader who knows them, the last for the layout.
- The languages of spelling and of OCR are to be imported, not bundled with
  the application and not packaged by the project: from an index of the
  project's own, signed, with the files wherever is convenient, so that
  their content and stability are the project's to control. On Linux the
  system's Hunspell and Tesseract languages serve as well, and an imported
  language comes before them. The Norwegian dictionaries become import
  packages like the others. That is the next piece of work, after the
  translations.

## 2026-10-06 — languages of spelling and of OCR imported

> Could you make the spelling and ocr changes. I suggest that the import comes from my server robertemilberge.no/glaukopis/ by default, but it should be possible to change this. Also it should be possible to import single spelling or ocr languages with single files, with instructions about how these files should be formed (a zip file with the files needed I guess). Make the spell and ocr files for GB and US English, Bokmål, Nynorsk, Swedish, Danish, German, French and Italian for now.

What this settles (ADR 0032):

- Languages of spelling and of OCR are imported under *Settings*, from
  `https://robertemilberge.no/glaukopis/` unless another server, or a
  folder, is said; or from files: a language package (a zip with a
  `manifest.json`), a dictionary extension of LibreOffice or Firefox, the
  `.aff` and `.dic` of a dictionary, or a `.traineddata`.
  `docs/language-packages.md` says how a package is made.
- What the server offers is checked against the size and the SHA-256 its
  index says. The index is not signed, as was thought before, since the
  server can be changed to one's own.
- An imported language comes before the system's. Tesseract, where any
  language is imported, is given a folder of its own data and the imported
  languages together.
- `scripts/make-language-packages.py` makes the packages: dictionaries of
  English (American and British), Norwegian (Bokmål and Nynorsk, the
  project's own), Swedish, Danish, German, French and Italian, from
  LibreOffice's; and the data of `tessdata_best` for English, Norwegian,
  Swedish, Danish, German, French, Italian, and, asked for after,
  Ancient Greek and Latin, Tesseract having one Norwegian and one English. They are put on the server by hand.
- Nothing is bundled but Tesseract itself, with its English: the
  dictionaries leave the application and the packages of dictionaries for
  Arch are given up; the deb and the rpm recommend the system's English.

## 2026-10-08 — breaks in search, elements across projects, the pane of projects

> There are now two types of line break, and it is a bit unpredictable what gets imported from different types of files. The regex search and replace does not work properly for line breaks. Only \n is detected and no linebreak type can be in the replacement string. Simple question: Would it not be better for this program to have only one type of line break?

Answered: keep both, as documents need both, but let search and replace find and make both, bring documents in by one rule, show the break within a paragraph, and offer to turn breaks into paragraphs.

> Just do 1. and 3. Also, could you make it possible to copy and move elements between maps and projects? Could you also make the All projects list which is now on the home page also available as a pane that can be opened on the left side when projects are open, so it becomes easy to move between projects?

What this settles (ADR 0033):

- In regular expressions `\n` is a break within a paragraph and `\p` a
  paragraph break, in what is searched for and in what replaces it; a search
  with `\p` reads the paragraphs of an element's text as one, so that what is
  found may cross them, and a replacement may split and join paragraphs.
- The break within a paragraph is shown by a faint ↵, on the screen only.
- Elements are copied and moved to the maps of other projects, from the menu
  of elements and by copying and pasting, carried with their kinds; comments
  and the bond of a copy to its original stay behind.
- In a project a pane at the left holds the list of projects, to go from one
  to another; Ctrl+Shift+L opens and closes it.
- Bringing documents in by one rule, and a command that turns breaks into
  paragraphs, were proposed and not asked for now.

## 2026-10-08 — the words as a project, the sign of breaks turned off, a loose element made the centre

> Back to the language edit script. Why not export to a Glaukopis project instead of Libreoffice Calc? The script places it as one of the current user's Glaukopis projects, and also reads it from there?

> Yes, make the project based translation edit.

> Also, it must be possible to turn off the line break symbols. An icon beside the spell check while typing icon, perhaps?

> Also, it should be possible to move the head of a tree into a loose element, and make the loose element the head.

What this settles:

- The words of any language become a project from the settings, and are
  written back as Fluent files from a bar over it (ADR 0034).
- A button beside that of spelling in the writing tools hides and shows the
  sign of a break within a paragraph (`breakSigns`).
- **Make it the centre**, in the menu of a loose element, makes it the
  centre of its map, the centre that was going under it.

## 2026-10-08 — cut and paste, paste in more places

> When undoing a cut and paste of elements between maps, it is now necessary to undo in both maps, both where the cut was done and where the paste was done. Is should be the same undo operation. Is that possible? Also, the position of a deleted element should be restored when undoing the delete. There should be a paste under it menu item also for the head element of a map, and also a paste item in the right click menu directly on the diagram and in the text mode. When pasting into a map itself as a loose element, and not another element, the loose element should appear near the mouse pointer, if possible.

What this settles:

- Elements can be cut (Ctrl+X, and **Cut** in their menu): they stay until
  pasted, and are then moved, within the project as one step that one undo
  takes back; into another project they are made there and taken away from
  the one they came from. A move by the menu or by dragging was already one
  step; a copy, a delete and a paste are three.
- **Cut**, **Copy** and **Paste under it** are in the menu of every element,
  the centre too, in the diagram and in the text; **Paste here** in the menu
  of the map's background, where it was opened; Ctrl+V with nothing selected
  pastes where the pointer is over the map.
- An element deleted and brought back by undo was found in its place, loose
  or not, in the model and in the running application; how it was lost is to
  be learnt from the one who saw it.

## 2026-10-08 — own words without a new package, a project as one file

> How hard is it for the changed langauge strings to be detected by the app without making new packages?

> Yes, build it. Also, it should be possible to save and load projects as single files. References that are in both must be resolved in the process, unless they are identical. And make new packages again without the end-to-end tests.

What this settles:

- Own words, in a folder of the data directory, are laid over the words
  built into the program, the interface's and the core's, each message
  checked first; **Use them now** over a project of words puts its changes
  there and shows them at once (ADR 0035).
- A project is saved as one `.glaukopis` file, with its pictures and the
  works it cites, and opened from one as a new project; the references of
  the file are resolved against the library, what is the same without a
  question, what differs or looks like a work the library has by a choice,
  and the citations follow where a work is cited by another id (ADR 0036).

## 2026-10-11 — one tree per project, entered at any element; the owl map

A first proposal of the day, maps of several top elements and no centre, was
weighed and set aside for this.

> Nobody uses Glaukopis seriously yet, so we do not make substantial efforts to preserve old projects and maps. If what is already there can be opened and look ok, without a lot of effert, it would be great. I am not yet conviced that my new suggestion is the right thing to implement. Let us consider another option first. It may be a little more drastic change. The goal is to make the workflow as seamless and intuitive as possible. I think it should be possible to view everything in the app as a big map. Let the Glaukopis owl be the central element of the topmost map. There you can see all the project folders as separate elements with their projects as sub elements. The folders can only contain projects, and cannot hold any text, of course. Projects without a folder  connect directly to the owl. Then you can select a project and see it as a map. There, you will se the project as the top element, with its sub elements. You can choose to view any of these elements as the top element in a map again, and so on. There are no loose elements.The project pane on the side lets you see where in the hierarchy you present top element is. Now, let it be possible to preview and export any element in this hierarchy as a document, from the project itself to any sub element. This will work more easily with the template feature I am planning to implement, where a document template can be attached to any element. New elements can have a simple template as default, which for example only consists of a title field (with rich text), getting the first title of the element assigned as defailt, but which can be edited. I know this is a big redesign, but what do you think of it? Do you think it will be intuitive, flexible and easy to use? Tell me again about how it could be done, and the upsides and downsides to this.

> Yes, I think we will go for this. When seeing the map of projects and folders, with the owl as the top, make the "elements" look different than when inside a project or element. Also folders different from projects. That should make the distinction clearer, that the top map is not the same as those starting with a project, and further down. Elementes representing shared projects and joined projects should look differently also, perhaps? And yes, it should be possible to always see where one is in the full tree, and this should be very clear when looking at the pane with the list of projects (which now must be able to expand to the full tree), but do not make it too prominent, since one of the reasons to make a subelement the top of a map, is to hide the full project and focus on this one part. A question is whether to allow maps from two projects in the split views. I lean towards yes, but it should be clearly indicated when the views are from different projects. Perhpas a double line between the views is sufficient, but again, perhaps not. What do you think? And yes, elements should now be marked as part of the document or not part of it. I have tried it out a bit now, and for me at least, the work flow is to make several maps where nothing will be part of the text yet. Moving the elements that should be part of the text into a suitable hierarchy will normally come later in the process. Your idea of loose thoughts will normally be trees of their own or inside such trees, outside of the tree that holds the document(s). That is why a big project will have several trees, where one of them eventually becomes the document to be exported, while small projects may be the head document themselves, without any side trees inside, since most of its elements fit into the text. The flexibility we are building now, will make that workflow more intuitive and flexible, I hope. Are there more questions before we go on? I have one, by the way. I have no idea what you are talking of when you refer to such things as ADR xxxx. What is that?

> Any element should be considered a document that can be previewed and exported. They will have a minimal template as default. There is already a setting per element called "Leave out of the document". This may be a convenient setting if a text should be exported while some section is not ready yet. Or for some it will be a convenient place to store text that they have not decided will be part of the text or not yet. Do you agree, or have I misunderstood your suggestion? I am not sure what you mean by a tab or the bar. Where are those on the page now? Yes to 3. Yes to 4, automatic first. Yes to nested folders. And even another question before we go on. Should we design the template system before going on, or can that conveniently be left to after this is done?

What this settles:

- A project is one tree whose top is the project itself; any element is
  entered as a map and printed as a document; there are no maps and no loose
  elements; **Leave out of the document** is the one mark (ADR 0037).
- The owl map over folders and projects, as a third form of the home page,
  with looks of its own, badges for shared and for joined projects, laid out
  automatically; folders nest.
- Where one is, shown fully in the pane of projects and briefly in the bar;
  two projects side by side, told apart in the bars and by the divider.
- The project's text takes the place of its description.
- Templates are left for after, with their place in the settings kept.

## 2026-10-12 — the kind of a paragraph, and passages, thought through anew

> The paragraph style system needs some reworking. Now it is unclear when a style pertains to a paragraph or a whole element (at least sometimes changing the style changes all the paragraphs in an element, other times it only changes the paragraph with the caret. And I don't know when or why). But most important, there is a mix up between type of text and formatting. Type of text should not bring any formatting in the export (but should for most types be indicated somehow in the text view). The formatting should be part of the template and layout system. Now, for example, the explanation of stage direction says it will be in italics. I guess this is only something the help text says, and the system actually works almost as I say, that the appearance is not hard coded in the text type, but it shows that there is something we need to work on for the logic of the whole thing. For example, I can no longer remember what the "Kinds in hand" menu is supposed to be. It has almost the same things inside as the More menu. It seems to me that the text types and the kinds of paragraph somehow has overlapping functions, and it does not at all seem unintuitive to me. There are also some assumptions made about types of text that seem too strict or not well thought out for me. I will use verse as an example, but it pertains to most types, like scripts also. Verse includes the function of line numbering. The first problem with this is that there are a lot of text types that may need line numbering, perhaps all text types could at some point need it. The other problem is that the appearance of line numbers in verse is unflexible it seems. Sometimes we want them on the right side. And as I have mentioned before, sometimes they do not follow the actual lines, and need to be set manually. Now it is made possible to change the number at a place, and the next numbers will follow. But sometimies there is need of numbering that is complex, so like ten lines were five of the lines are numbered 45 77, 46, 50, 53. Now, I have only given you some of the symptoms of the problems with the logic of the text types. I want you to rethink the whole logic, not only find adjustments that fix the problems I have presented, but to rework how text types works in a way that makes it much more intutitve, flexible and logical than it is now. Try to see what similar problems could arise from the system we use now for all kinds of texts, and see if you can come up with a new way of treating text types that makes sense, where such problems get resolved by the logic itself, not by making admissions for all kinds of things. I thik you understand what I am after. Think hard about this, and come back to me with a plan, or some options if you see more than one good way of dealing with this.

What was found: a paragraph of a kind was stored three ways (a container,
a typed paragraph, the role of a line in a container), and the menu listed
the three as one; the catalogue carried the looks, and no layout said
anything of a kind; line numbering was the verse container's. Seven rules
were proposed — one choice, the kind of a paragraph; passages as
consequences; families; what is said of a passage said on it; no look in a
kind; numbers belonging to what they number; one list of kinds — with six
choices put to the owner.

> My choices: A Yes, lists as kinds. B Yes, Screen cues as you suggest. But in the future it we should make settings for the appearance of the screen cues as well. C. D. and E. I agree with you. F. We call it Verse, but it could be used in any type of text. Many dramas do not have verse. Some poetry does not have verse. Intuitive and sensivle default should be presented, with flexibility and versatility as well as simplicity built in. That is the way to go. Let's do it.

What this settles (ADR 0040):

- Every paragraph has one kind, set on the paragraphs selected; passages
  form of themselves from paragraphs of one family, shown by a bracket,
  and what is said of a passage is said from the bracket; nothing acts on
  the element.
- Lists are paragraphs of kind *item* or *numbered* with an indent; the
  list structures go.
- No kind carries a look: the base looks live in the core as the table
  every layout is resolved against, and the layout editor shows every kind.
  The editor's cues (a bracket, small capitals for a speaker, italics for a
  direction) are its own and reach no document; settings for them are a
  later piece.
- Any passage can be numbered: not at all, counted from the first number
  given, or only by the numbers given; the side and every-how-many are the
  layout's, with a passage's choice over it; numbers are edited in place.
- One list of kinds, no pinning; the verse family is called *Verse* and
  serves poetry, drama and transcripts alike.

## 2026-10-14 — the files of the library

> One more new feature. Now it is possible to import attachments to references. What kinds of attachments make sense to attach? Only pdf? In any case, we should have a repository of all attached files, much like images. The function to make pdfs readable or add a pdf or an image as an element, should be easily reachable from the repository. The question is whether images and attachments, like pdfs, are part of the same repository, ordered by file type. Or if even references are in this menu. I lean towards not mixing references with files. But how do you suggest implementing this?

A first answer proposed two stores, a files view inside the library, and
that every file has a reference and goes with it. The owner objected:

> Some users, and I am one of them, have a big store of pdfs with books and articles. I would like to import it, so it it becomes easily available from inside Glaukopis. I am not against the idea that each of these will get a reference. The problem is that my reference library already have references to most of these texts. Will the import system recognize that the pdf and the reference belong together? I am also a bit uneasy about the rigidity of the idea that all the pdfs must belong to references. No manual going through pdfs and assigning them to references? Perhaps this is the best way to do it, but it does feel a bit like "don't worry, the machine knows best", and the user becomes a bit estranged to how things actually belong together. The idea that the files I have imported will disappear when its reference makes me hesitate to embrace the solution.

> This sounds great! Just one small question. How would you organize the files? I think at least they must have a folder system of sorts. How would you do it?

> Let us do it your way. It should be possible to export folders or single files, where the folder structure then becomes what we see, and file names contain editor/author, title and year, where they exist. Make a plan for this that I can give to Opus 5.5 afterwards.

What this settles (ADR 0043, built from `docs/plans/the-files-of-the-library.md`):

- The files of the library are a store of their own beside the pictures,
  divided from them by their role, not their kind; any kind of file is
  taken, and what can be done with it depends on its kind. A file crosses
  to the pictures, or a picture to the files, on purpose.
- A file may belong to no reference, one or several; files are never
  removed with a reference unless asked; folders of their own, nested, kept
  in a record beside the store, with the store on disk unchanged; a folder
  taken in keeps its structure.
- A files view in the library's place, with the actions of each kind; the
  going-through, where the machine proposes by identifier, name and first
  page with its reason shown, and the writer decides, any day.
- Export of a folder, chosen files or all, the folders becoming folders on
  disk and every file named by author or editor, year and title where it
  has a reference, with a `references.bib` beside when asked.

## 2026-10-15 — the text a PDF has, kept or read anew

> A question: How does the ocr work on pdfs that already has text? I just tried to scan one with ancient Greek text, where the text that comes with the pdf is almost only giberish, and then the ocr also presented mostly giberish. There should be a function to totally disregard any text that comes with the pdf, becuase it is not rare that this is unreadable. Could you tell me how this works now, and suggest how you think it should be.

> What I did, actually, was to read into an element. This does it differently, and I am not provided the option to not take the text already there into account. I cannot see any reason anyone would want two layers of text on their pdf. Should we not let them choose, either keep the text already there or substitute it with the newly read, both for reading into an element and for making a pdf readable?

> Good, make this. And build the arch package when done.

What this settles (addendum to ADR 0018):

- One choice wherever a PDF is read: keep the text the PDF has, or read
  every page anew in its place; laying new text over old is gone.
- The text a PDF has is judged as well as counted; where it does not read
  as text, that is said, and reading anew is chosen at first. Its first
  lines are shown before anything is taken.

## 2026-10-15 — the text a PDF has: read right, shown whole, translated

After the reading of an Oxford text of Aristophanes gave gibberish twice,
from the PDF's own text and from Tesseract:

> The text read from the pdf is still a grabled mess. I refuse to believe Tesseract cannot make a better job of it. The pdf is a modern ebook, made digitally, so not a poor scan. On screen the text is crisp and flawless.

> What worries me the most now, is that we have made an option to very exlicitly not take the text coming with the pdf into account. I have suspected that it did that anyway, and have repeatedly asked if it does, and you have said no. Now it turns out that what it has done, is to read the text coming with the pdf, and not used tesseract to read the actual forms of the letters. Is there something I don't understand about this?

> What I think we should have, is a clean an understandable inferface for this. If there is text in the pdf already, show a preview of it in a scrollable view, so I can look at the whole thing before I decide what to do with it. If it is, for example, Porson glyph (is that a standard thing, or are there a lot of non-standard ways of encoding Greek and other texts in pdfs?), then we should inform of that and give the option to translate them into readable unicode text. And for pages that cannot be read. I think we must solve that problem. All my open source pdf readers can read this pdf without problems, so there is a serious problem with the pdf reading library used, I suppose.

> Making an ocered text based on this pdf as it is displayed as images of pages, no matter what its current included text is, will be one of the options for what we are making now?

What was found on the book: the drawing library draws every page; the
PDF's own map from glyph to Unicode is wrong, while the font names every
Greek glyph by what it is; the text library drops glyphs whose names it
does not know; Tesseract errs on rows of accents, on the lunate sigma, and
when Latin-script languages are read with Greek; and a page Tesseract
could not read fell back in silence to the PDF's text.

What this settles (ADR 0044, built from `docs/plans/the-text-a-pdf-has.md`):

- The glyph names reach the application, through the text library taken
  into the tree and changed in that one respect.
- Schemes recognise and translate how a font or a text keeps its letters:
  composed Greek glyph names, Adobe's expert names, Beta Code.
- Wherever a PDF is read: the whole text to look through, a line that says
  what was found, and three choices, keep, translate, read anew. For a
  searchable PDF, translation puts right the PDF's own tables.
- Reading anew is Tesseract alone: a page that cannot be read is empty and
  says so; the counts are said and logged; lines of accents are dropped,
  final sigmas mended, Greek with Latin languages warned of.

> I would like you to do the plan as written here: /home/proteus/koding/glaukopis/docs/plans/the-text-a-pdf-has.md

Built the same day; on the owner's Aristophanes, page 98 of the print reads
as printed when translated, speakers, breathings, accents, iota below and the
apparatus.

## 2026-10-15 — the shape of a page, and a rule for the whole program

Asked what it would take to keep a PDF's layout when making elements of it,
a first answer proposed reading speakers and verse off the page, from the
owner's Aristophanes. The owner set a rule:

> I have a suspision that you have become somewhat stuck in my single problematic Greek drama pdf. Glaukopis is a general app for any type off text. The fact that I am sometimes woring with Greek texts does not say anything about the general purpose of the program. Please do not make design descisins based on my pecullar needs, but on making the program genrally useful for anyone working with texts. So here, for example, we do not want the ocr engine to specifically look for Greek drama texts, as it seems you are suggesting. Then it must do the same for any type of text. But all pdfs have a layout. It would be nice, if a text has headings, that it is detected, and if there are recurring elements with different styles, they could get their own kinds, but unless the program can deduce that this is a drama, this is a novel, this is a news paper scan and so on, it should not automatically give meaning to the kinds. […] I am not making a tool just for myself, but a tool useful for anyone writing texts. I do want it to meet my needs, but it should not center around those. It should make sure it meets anyone's needs.

> Make the plan for me to give to Opus 5.5.

What this settles (ADR 0045, built from `docs/plans/the-shape-of-a-page.md`):

- The rule, for every feature: design from what texts in general have;
  find structure, never give it a meaning the program cannot know; name what
  is found by its look; the owner's texts are a case to test against.
- The shape of a page read from its geometry, the same for a PDF's own text
  and Tesseract's: headings become elements; lines kept where the page keeps
  them, as text with line breaks; numbers in the margin the given numbers of
  their lines; recurring styles shown with samples and named by the writer,
  as a kind of the catalogue, a kind of their own, or plain text; running
  heads and page numbers dropped; two columns ordered.
- The warning on Greek with Latin languages made general, for any two
  scripts whose letters look alike.


## 2026-10-15 — the shape of a page, built

> Please build after this plan: /home/proteus/koding/glaukopis/docs/plans/the-shape-of-a-page.md

Built as planned: lines with their style and runs of marks, `ocr/shape.rs`
(written by an agent from a brief) and `ocr/shaped.rs`, the choice *Keep the
shape of the pages*, the styles found named before the document is brought
in, the warning on scripts whose letters look alike, and the guide.

Done otherwise than the record, and why:

- A first line set further in is left to the layout, not made an indent of
  the whole paragraph, which is what the indent of a paragraph is.
- Numbers within the text's edges are taken where they count upward, and
  lines are kept where they are short by choice, not only ragged: both
  rules of the agent's, held by tests against tables, years and prose.
- A line remembers where the spaces between its words stand, from the PDF
  and from Tesseract's words, so that a number is taken from the end of a
  line by the room measured before it, not by a guess from the width of
  letters; and a number at the end of a line flush with the column of
  numbers given beside lines of its size is one of them.
- A spacing accent drawn over the letter before it becomes the combining
  accent, in any script.
- `pdf-text` reads the widths a CID font gives as a range, and tells a CID
  font's name.

The owner's Aristophanes, print pages 98 to 120, as one test: running heads
and page numbers gone; the verse kept as lines, speakers at their heads, 107
line numbers given, all counting up, none left in the text; the smaller
text at the foot a style found. That smaller text comes as three styles, as
the edition sets its Greek and its Latin in two fonts a point apart: to be
named the same, which makes one kind. Fonts set together in one line as one
face is a later step.

## 2026-10-15 — files given to their references one by one

The owner added a folder of over a thousand PDFs, selected all and chose *Assign to a reference…*, expecting a going-through:

> I assumed that there would be some kind of batch process, trying to automatically assign them to a reference, so when the dialog asked: "Choose", I thought I was choosing which book to assign, not which reference to assign all my 1000 pdfs to. I did the mistake twice, and now there are two pdfs with 1000 references, and it seems the only way to remove them is one by one, with confirmation for each. Do not worry about my reference problem now. Worry about how this cannot happen again. I cannot see any reason for providing mass assignment of one reference to a lot of pdfs, can you? What I would like, instead, is a streamlined way of assigning pdfs to the right reference, or if not, suggest to make a reference. I cannot see why this cannot be very similar to the converting citations when importing a text.

The going-through that was wanted existed since 2026-10-14; it stood third in the menu, and the one action that gave a reference to many files said nothing of what it did. Proposed and accepted (ADR 0046, plan `docs/plans/files-given-to-their-references.md`, for Opus 5.5):

- No reference is given to many files in one step from a selection; *Assign to a reference…* only in the pane of one file. Several files of one work are added from the work's side, *Add files of the library…* in the reference's pane; attaching several from the disk asks first, with the count.
- The going-through is the one action over several files: first in the menu, the main button, and offered by a bar at the head of the folder that stands until the files are gone through. It learns the folder's name as a clue, where the folder is named as files are, with a year, and groups its rows by case, each group with a head row.
- A rule for the program: a button over many things says how many and to what; what was done to many can be undone at once (*Undo* after a going-through, *Remove all N from this reference*).
- No threshold that asks only above some number, and nothing assigned without the writer's say.

> Yes, make a plan for Opus 5.5 to build it.

## 2026-10-15 — files given one by one, built

> Please work from this plan: docs/plans/files-given-to-their-references.md

Built as planned, in five steps: every file taken from a reference at once
in the core; the folder's name as a clue; no assignment of several files to
one reference, the going-through first and offered by a bar at the head of
the files; its rows grouped by case, its button counting, and Undo at once;
the pane of a reference with *Add files of the library…*, *Remove all N from
this reference*, and a question before several files are attached from the
disk; the guide; the files script.

Done otherwise than the plan, and why:

- The folder named for a work leads, and the file's own name fills only what
  the folder leaves out: a file in such a folder is named for its part
  (*chapter 3*), and its name is not the work's title.
- Every new word is in Norwegian as well as English: Norwegian is kept
  complete, and the test of the words holds it so.
- The undoing removes the references made in the form of a row, *New
  reference…*, as well as those made from the services, since both were
  made in the going-through.
- The new checks of the files script come in a fourth part after the
  export, so that the export counts what it counted.

> Build arch packages when finished.

## 2026-10-15 — the settings window, ordered and said briefly

The owner asked for most help texts to go, and for an order: Appearance
(with an editor font and *Document structure*, and a pangram as the sample,
in English and Bokmål only for now); New documents; Language, holding the
interface, new texts, Spelling and OCR, each list of languages saying
*System* or *Imported* with a cross for an imported one, an import button
whose list closes, no importing from files, and the words added to
dictionaries in a window of their own; Your details (first and last name,
organization, title, address, phone, email, ORCID); then the translation
project of Glaukopis's strings at the foot, before About, which shows the
credits and licences behind a button.

Built the same day; the credits were gathered by an agent from the
packages' own metadata. Kept, though not asked for: a line under Email
saying it is sent to bibliographic services with each lookup, as before;
Tesseract's place among the programs. Other languages keep their old sample
sentence until someone gives a pangram.

## 2026-10-15 — the structure of a document read from a PDF

> The "Read as new element" should be renamed to something like "Import text to new map". When keep the shape is selected. We get each page as an element still. Would it not be better to try to recreate the actual structure of the document in question, so a title becomes a title and headings of different levels come in the right place in the structure of the map? Do you think this is possible and useful? If you think that, make a plan for it to be built by Opus 5.5.

Renamed the same day: *Import the text as a map…*, with the button *Import*.
Judged possible and useful: the shape already finds the headings and their
levels over the file; what is left is the title, the tree across the pages,
and the pages kept as marks. Record ADR 0047, plan
`docs/plans/the-structure-of-a-document.md`, for Opus 5.5:

- With the shape kept, the document is imported by its headings: a tree of
  the headings' levels, the title naming the document's element, what stood
  before the first heading as its own text; the pages not elements.
- The levels from the surest source: the PDF's own outline where it has
  one, matched to the lines by their words; numbered headings by their
  numbers; the rest by size, as before.
- Paragraphs and kept lines go on across a page's edge; a reference mark
  with the page's number where each page begins, chosen in the dialog, on
  at first.
- *By its pages* stays as the other way, chosen at first where no heading
  is found, and for editions cited by page.
- The outline shown in the dialog before the import is made.
- No heading by its words, no fields from the title page, no table of
  contents read: for later or never.

## 2026-10-15 — the structure of a document, built

> Plase do the work of this plan: docs/plans/the-structure-of-a-document.md

Built in five steps: the title and numbered headings in the shape; the
file's own outline read and matched with the lines; the structure across
the pages, with page marks, in the core; the choices and the outline in the
dialogs; the fixture, the OCR script and the guide.

Done otherwise than the plan, and why:

- The title stays among the pieces of its page as a heading of level 0, not
  a separate return value: by its pages it keeps its place, and by its
  headings it is taken out to name the document.
- `imported_pdf` keeps its signature: the way and the marks travel in what
  `read_pdf` returns. `Imported` gains `structured`, so that the dialogs
  show the outline only where the parts are the document's headings.
- A one-line paragraph that the outline names is the heading whole: the
  subheadings of the fixture, set in bold a little larger than the text,
  came out so.
- The remark that no heading was found is said only of files of more than
  one page.
- A page mark inside a joined paragraph stands before the first word of
  the new page.

The owner's Aristophanes, print pages 98 to 120: no heading on those pages
(the middle of a play), so by its pages, with the remark; the rule worked as
written and was not changed.

## 2026-10-15 — release 0.2.0

> Now, let us make a full new release. It will be 0.2.0, I think. Make the packages of all the supported operating systems for Linux, bake Arch packages, deb and rpm. And make the windows and mac installers. Put all the files in one folder with the updated index.html for my Glaukopis download page.

- Version 0.2.0, tagged `v0.2.0` and pushed with main; the installers for
  Windows (NSIS and MSI) and macOS (Apple silicon), the deb and the rpm made
  by the workflow `Installers` on GitHub; the Arch packages built here from
  the release's archive with `packaging/arch/release/PKGBUILD`, made anew from
  the PKGBUILD of the tree (the dictionaries' packages of 0.1.0 are gone).
- The tests on GitHub had failed since 13 October, and the first run of the
  installers stopped in its tests: the format check went over the vendored
  pdf-text (now left alone by a `rustfmt.toml` of its own), a remark's
  example caption depended on the order a newer Pandoc gives (now the first
  in the order of the alphabet), and Poppler wrote the Greek of a test in
  the code page of Windows (now asked for UTF-8). The tag was moved to the
  commit with these mends, before anything was published from it, and
  everything was built again from it.
- All the files, the page with what is new, `SHA256SUMS` and the language
  packages, are in `packaging/release-0.2.0/`, to be uploaded into
  `glaukopis/` of the site.
- A pre-release on GitHub, *Glaukopis 0.2.0, a version to test*, on the tag
  `v0.2.0`, with the installers, the packages, the PKGBUILD and
  `SHA256SUMS`, as 0.1.0 had (the language packages are on the site only).

## 2026-10-17 — the owl map behaves as a tree

> Did we make a plan for making the top level tree of folders and projects a similar interface as the trees inside projects?

> Yes, I want to keep the distinct look, and bring over the behaviour. Make a plan that I can give to Opus 5.5.

What this settles (ADR 0050, built from `docs/plans/the-owl-map-behaves-as-a-tree.md`):

- The owl map keeps its look: the owl, folders as labels without a box,
  projects as cards; nothing added looks like an element of a project.
- What is done in a project's diagram is done on the owl map: selecting one
  or several, going about with the arrows, making a project with Enter and a
  folder with Tab and naming it in place, renaming with F2 or a letter,
  moving with Alt and the arrows or by dragging onto a folder, the owl or a
  card, folding with Space, deleting with Delete, undoing every change of
  the home from its toast and with Ctrl+Z, for the session; menus on
  folders and on the background; a place of its own in the key sheet.
- A folder is entered as an element is, with a route of its own, the bar
  saying where one is, and going up from a project coming to its folder.
- Not brought: an order by hand (folders and projects stand by name
  everywhere), positions, copying and pasting, associations, comments.
- Choices made in the plan that the owner has not been asked about: a
  single click selects and a double click opens; Enter makes and no longer
  opens; where new things go; what *deeper* means; the undo is the home's
  and the session's.

## 2026-10-17 — the map of the projects as one map

> The project titles in the top owl map should wrap, so we can see the whole title. It should be possible to open the map under each project also on the top map, and jump in anywhere. I would also like to be able to move the project elements around just as in the normal maps.

What this settles (ADR 0051):

- Titles of projects wrap on their cards.
- A project's map is shown under its card, read from disk, and any element
  of it opens the project there.
- "Move the project elements around" was read both ways, and both are
  built: folders and projects are put by hand where they are dropped, kept
  on this computer; and the elements of a project's map shown on the top
  map are moved as in that project's own map, by dragging and by Alt and
  the arrows, and carried to another project by dragging onto it, each
  move written into the project and undone from its message.

## 2026-10-17 — the maps of projects on the top map, seen as in a project; the view that was lost

> What would be best, is that when opening the project trees from the top owl tree, the project element looks like a top element in the other trees, and that it opens closed. When opening sub elements of a project, they should look like they do in the normal tree, but not be editable before you enter a project (or element). Now somthing happened to the view, so I was able to se one of the connecting lines, but could find any of the map elements anymore. Pressing the zoom to see the whole tree button did not work.

What this settles (ADR 0051, amended):

- A project's map on the top map begins with the project's own element,
  drawn as the top of a map and closed; the elements under it are drawn as
  in the project's own map, and are not changed on the top map: moving
  them there, built earlier the same day, is taken out.
- *Show all of it* fits the whole top map, down to a twenty-fifth; a view
  that loses its place is fitted anew. What was seen, one line and nothing
  else, is what a map wider than a diagram's smallest scale showed when
  centred on its middle.

## 2026-10-17 — the top map: projects as the top elements of their maps, and the chaos after moving a tree

> There are many strange things happening with the top owl tree. I want it to function as much as possible as the trees under the projects. Now the project becomes an element under the projects. That is very unintuitive. Let the project elements look like top elements in the project maps, and let it be possible to open these in the same way as in the project maps. I tried to move a big tree around, and it all became chaos, and even after undoing everything and closing the project with so many childeren, things are still very messy.

What this settles (ADR 0051, amended again):

- A project on the top map is drawn as the top element of its own map and
  stands for it: no card, no element of its own under it. Its map opens as
  an element's does, by the fold button at its side or Space, the trees
  under it as the project's own map draws them.
- The chaos was found and mended: a thing folded or unfolded was kept
  where it stood on the screen for ever, and a drag that followed moved the
  view under the pointer without end until the drawing broke. The keeping
  now lasts a moment, and never during a drag.

## 2026-10-17 — the top map: nothing else moves, no message, one level at a time, elements moved

> When moving the project elements, the other elements move randomly around somewhat. The "this was put there" message is just disturbing. When opening the elements under a project, open only the top levels, not the whole tree. It must also be possible to move the elements around.

What this settles (ADR 0051, amended):

- A thing placed by hand on the top map keeps its room among the rest, so
  that nothing else moves; the project's own maps are as they were.
- No message is made of placing a thing, nor of moving an element within
  its project; Ctrl+Z undoes both, and says so.
- Opening a project's map shows its trees only, each folded; every
  unfolding shows one more level.
- The elements of a project's map are moved on the top map as in the
  project's own map, by dragging and by Alt and the arrows, each move
  written into the project; renaming, making and deleting stay in the
  project.


## 2026-10-17 — release 0.2.1

> push and make all packages for all systems, version 0.2.1. Update the index.html file and put everything in one folder

- Version 0.2.1, tagged `v0.2.1` and pushed with main. The installers for
  Windows (NSIS and MSI) and macOS (Apple silicon), the deb and the rpm made
  by the workflow `Installers` on GitHub, all three systems built and tested;
  the Arch packages built here from the tag's archive with
  `packaging/arch/release/PKGBUILD`, which carries its checksum.
- The page of packages says what is new in 0.2.1: the map of the projects
  worked as a map, pasting and menus on Linux, making a PDF searchable on
  Windows, projects made in folders.
- All the files, the page, `SHA256SUMS` and the language packages are in
  `packaging/release-0.2.1/`, to be uploaded into `glaukopis/` of the site.
  No release on GitHub is made yet.


## 2026-10-22 — one home, one tree, one set of keys

> I am still not happy with how the hierarchy owl->project->element works (with possibility of folders between the project and the owl. Why can I not move a project into another? I know that it is possible to open two projects side by side, but I forget how to do it, and am not able to understand what to do intuitively. Based on this, could you make a general assessment of how the interface handles this hierachy, with focus on simplicity, making it intuitive av obvious how to do things, and that things should just make sense. Give me some suggestions for how to fix it, and I will choose what ideas I think are good.

The assessment found two homes (the page and the map, with crossing ways
between them), the same folders and projects shown three times with
different menus, the seam at the project hidden by the picture, four
meanings of *All projects*, the list at the left off by default yet the
only door to a project beside, and several keys for one thing. Twelve
suggestions were made.

> We leave aside moving projects into projects. Do 1, 5, 7, 9, 10. Another suggestion I have is to let orgmode keyboard shortcuts for navigating the tree of elements/projects should be the one way. It is confusing with several ways of doing the same thing. Could you make a plan for this, which I can give to Opus 5.5, so it must be quite detailed.

What this settles (ADR 0062, to be built from
`docs/plans/one-home-one-tree-one-set-of-keys.md`):

- The map of all projects is the home; the page of cards and list goes,
  with the back arrows. *Last used* is a form of the list at the left.
- Folders are drawn as regions around what is in them; a project takes no
  project dropped on it.
- One menu for a project and one for a folder, the same everywhere; going
  in is *Enter* everywhere, and *Enter beside* opens a project in the
  second side.
- *Side by side* is a menu: this element as diagram and text, another
  element, another project; Ctrl+Shift+S.
- Moving a project into another is set aside.

A first draft took Org mode's keys whole. The owner:

> No, I think I retract the idea of following orgmode so strictly. The logic is not really the same. Could you just suggest a keyboard shortcut scheme where each thing has only one combination, and I prefer the orgmode alt+enter for new element, and that it is the same in text mode and diagram mode where it makes sense? Also when pressing alt+enter at the start of a paragraph, it should make it into the title of an element at the same level, with the text below inside it. What do you think?

A scheme was proposed: one key per act, the same in the diagram, the text,
the map and the list where the act exists; Alt+Enter a new element after,
Alt+Shift+Enter one under (on the map, a folder), Alt and the arrows move,
Alt+Shift+Down and Up go in and up, Enter opens, Tab folds, Shift+Tab all,
F2 renames; in the text Alt+Enter makes a heading at the cursor, the tail
of the paragraph its name and the paragraphs below its text, first among
the sub-elements where there are any.

> Yes, I agree. The only one key for each thing is a general principle, but not a rule. We should do what makes sense. So make the new plan.

- One key for each act through the tree, as proposed; Ctrl+Y and F3 stay
  as second keys that harm nothing. The record's key section and the
  plan's stage 3 are rewritten to it.

## 2026-10-23 — the list is the tree, the path says where you are, the window as it was left

> The last interface reworking of Glaukopus does not work. We must simplify and clarifay a lot. I think we must give up on the idea of a mindmap going from the owl to the inmost element. We lose the owl and its digagram. The left pane with the tree of projects, with folders, and with the possibility to display the whole tree under the projects, that will be the thing. When Glaukopis is opened, it should look as much as possible as it was when it was closed. The same project(s) open, the same map(s) open. If possible, the text view should be where it was in the text when closing. That also goes for the diagram view. It is possible to close open projects. If no project is open, the screen shows the owl, a "Create new project" button, a list of the last opened projects, if any. The "Side by side" button is renamed "Split view". It must be much easier to see whether the two views are from the same project or from two different. Let us copletely redesign the tool bars. They are in serious need of tidying up anyway. The top bar should contain the full path of the open element, with a dropdown icon, with a hierarchical menu of all projects. When the view is split, it is split all the way up to the top bar, where both sides will show the path to the current element. If the whole path cannot fit, it must be elided so the topmost levels and the bottommost levels still are visible. There must be a quite high contrast colour difference between the active view and the other view. It should be possible for the views to switch sides. After this is done, we can start to plan how to completely rearrange the toolbars. Please tell me what you think of what I have proposed. Are there any concerns? If not, make a plan for it that I can gove to Opus 5.5.

The assessment agreed: the map promised one tree and could not keep the
promise at the project, and the list at the left already does what is
wanted; the proposal is the shape every program with documents and folders
has. Concerns raised, none against the proposal: what is open is what is
shown (no tabs); the second project stays a guest of the first for the
panels, the preview, the sharing and the history until the toolbars are
rearranged; the text keeps the element at its top, not a pixel; a project
is opened and closed, an element entered and left; the tools of the window
stand outside the cells of the sides; the *Last used* form of the list
goes; the window's size is kept by the application, not a plugin.

What this settles (ADR 0063, proposed; to be built from
`docs/plans/the-list-the-path-and-the-window-as-it-was-left.md`):

- The owl map goes; the list at the left is the one tree, on by default,
  with the ways to begin, the deleted projects and the project of all the
  projects in its head; a project is opened, shown beside and closed from
  its menu; the list marks the project of each side.
- `#/` is the start screen: the owl, *New project*, the projects last
  opened.
- The settings keep the place, the projects last opened and the window's
  size; the view keeps the element at the top of the text, the focused side
  and whether the sides are switched.
- *Split view*: a cell per side in the top row, the active one in the
  accent, × and Ctrl+W close a side, *Switch sides* mirrors them.
- The top row holds the path with a chevron that opens the menu of all
  projects, elided in the middle when it does not fit.

After the assessment, the owner:

> The real decisions about the tools of the window will come afterwards. The top bar will only have the current element path with a dropdown, except perhaps the split views button. Let the rest be on a bar under that again for now. I will think hard on how to rearrange things afterwards. Is that ok? If it makes the changes simpler, I agree to let the second project stay a guest for now, but in the end both projects will be of the same status. I guess the two projects will need its own history (but two projects can be open now, too, and they keep their history, so I am not able to see why that should be a problem now). Perhaps, also only one of the open projects can be a shared project? I am not sure, perhaps it does not matter if both are shared with others? Now, those questions are for the next phase, if that is what you think is best. Could you adjust the plan according to this?

- The top row holds the paths and *Split view* alone; the bar of the
  project, less *Side by side*, stands under it as it is, and the bars of
  the sides stay, with × always; nothing else moves until the
  rearrangement.
- The second project stays a guest for now; in the end both are of the
  same status, decided with the rearrangement. Each project has its own
  history on disk and its own connection already; the questions of the
  history and of two shared projects are for the next record.

## 2026-10-23 — equal sides, the typesetting pane, the document pane, and the bars

> Some comments on what has been done now: The top bar dropdown should go down to the deepest elements, so one can choose to enter any element in any project. When opening the dropdown, the path to the current element should be opened and shown. I cannot see a way to make the views switch sides. That should be possible. The outline now opens and closes for both views no matter on which side one clicks the button. They should be independent. Opening a project from the left pane should open it in the active view, and leave the other view as it was.
>
> Now for some reworking. The preview pane is wrongly named. It is the place where the typesetting happens, and it conains a preview and a looks pane. The "About this document" does not belong here anymore. There is also a conceptual mixup which must be fixed with the pane which has Look as a tab. Look does not belong on this pane. "Look" should be directly connected to the typesetting pane, the other tabs should not. The others should be reachable as info and options of the document in view. So they should be on a pane of their own, reachable also when the typesetting pane is closed, by clicking the pane button in the toolbar. Contrary to the typesetting panes, the document pane always shows what pertains to the document in the active view. I am not sure what to call typesetting (if that is the correct in English...) in Norwegian. Ombrekking or perhaps typografi, but I hope there exists a better term. I would like you to suggest what it should be called, both in English and Norwegian, and choose what to go for. A project should not remember its typesetting pane window status when it is closed (but if it was open when the program closed, it should still be open when the program starts again). Each view should have a typesetting button which opens the pane if it is closed, and sets the preview to the view where the button was clicked. The preview does not change if the focus goes from view to view, but the user must select it. If the view that is previewed closes, the typesetting pane closes too.
>
> Now to the general reworking of the toolbars and menus: The menu after the element path in the top bar goes away. "What this document is" is moved inside the "About this document" window (again) as a tab. "About this document" changes name to "Document properties" and is reachable from the context menu of whichever element we are in. "What this document is" is renamed "Document type". The "Document type" tab can also be reached from the "Looks" pane where this is set now. The button should not look like a dropdown menu, since it opens a window. The button over the preview window that also goes there now, should be removed. Move the "Look" button that opens the Look pane there.
>
> The button for opening and closing the projects pane should be all the way to the left on the top toolbar. The next toolbar should be duplicated for each view. I think we should go for icons without text with tooltips. First the outline button. A separator. Then the Diagram and Text icons. Then as separator. New element goes away. It is in the context menu. I find the kind of paragraph menu and the other menu (kind of words?) confusing. We must be clear about what they are (which does not meant to write a helpful explanation text). What is the difference between what is in the "Words" menu and the bold, italics and smallcaps buttons? Can they only apply to words? So a letter in a word can be bold, but not underlined? If they are not something else than what is in the Words menu, they can all move in there. But both menus must be made clearer. It must be intuitive. Also the line numbering must be moved to the context menu(s), perhaps of the element, or the top element, which is the document. At least, it does not belong in the toolbar, and we have to figure out how it should work. Separator. Spell check. See linebreaks. This should show all the common marks for different types of whitespace, so also tabs, paragraphs and differenciate between soft and hard spaces (if we allow that. We should probably allow that). A separator before the insert menu. We should move "Citation" "Note" and "Comment" into the insert menu. Remove the help texts in the menu. The menu item names are self-explanatory. But rename some of them: "Image", remove the dots from "Table", Reference mark should be someting like "Inline number", altough it can contain letters. Only one "Image" item. The user can add images from the Images store (which should also be renamed Images). Separator. Then Typesetting and Document pane. Share does not belong on the toolbar. Sharing should be a choice in the context menu of projects in the project pane. I think this could be a good start to make this clear and intuitive. Say what you think of this, and come with suggestions for what is still not fully worked out.

The assessment: four of the points run into the guest model of the second
side, so the sides must be made equal first; the marks and the kinds of
words are two things, which the toolbar hid; the "#" menu held three things;
*Typesetting* and *Ombrekking* for the pane. The owner:

> No, all the marks in the menu. No buttons. Bold and italics, alt least, should have shortcuts. The others are rare. Document type is in the Document properties. I do not think we need it as a tab on the document pane. That would be a tab opening the document properties, would it not? Not very intuitive. Undo/Redo come before spell check. The "Not saved" text I have never seen. A crumb sounds good. People present when hovering the head? Yes, typesetting button lit. Yes, timeline also, of course. I confirm equal sides also. Is everything clear then? If it is, make the build plan.

What this settles (ADR 0064, to be built from
`docs/plans/the-sides-the-panes-and-the-bars.md`):

- Equal sides: each with its project, its sharing, its saved view and its
  outline; the window keeps its arrangement; a project opens in the active
  side; the place names the active side.
- The typesetting pane (*Ombrekking*), with the Look column, shows the side
  whose button was pressed; the document pane follows the active side with
  the references, the images, the comments, the loose citations, the
  history and the changes; Document properties with a Document type tab.
- The top row: the list's button, the paths, a switch button, Split view.
  A bar of icons per side, in the owner's order; all marks in one menu;
  Paragraph kind and Words kind; Insert with Citation, Note, Comment,
  Image, Table, Inline number; the whitespace marks with a hard space;
  line numbering in Document properties and the text's right-click menu;
  Share… in the project's menu; Not saved on the crumb; Images.
- The path's dropdown is a tree unfolded to the current element.

## 2026-10-24 — the owl, the top row, the menus' hints, and the Look pane in plain words

> We are reworking the interface of Glaukopis to make it more intuitive and simple to use. We have come quite far. In the other session, just finished, the model ended by mentioning three things left for later:
>
> - Some words still say "picture" in the parts about documents, formats, styles, files and credits, and in some of the core's messages.
> - The text's right-click menu loses the focus, so Escape does not close it.
> - No script checks that a review in progress closes when the focus moves to the other side.
>
> Please read the last section of the brief and the newest record first.
>
> Here are my further comments and suggestions for improvement:
>
> The We will sacrifice the owl in the upper left corner, and put the project list toggle button there. Don't put a count on the number of projects in a folder in the project lists. Put the view close button on the top bar to the right in both views, but before the Split button. The split button should have a different background than the rest of the top bar, also when there is only one view.
>
> I want to to remove all the help texts in these menus:
>
> - Right click on a diagram where there is not element
> - Right click on an element (here we remove the "Print the name as a heading" option too. This is not a feature we want. And I don't understand what the "Stand for another element" means. I think we can get rid of it. But tell me what it is first.)
> - The "New reference" button
> - Every help text in the Look pane
>
> All of these help texts say obvious things, and I assume that everything is also explained in the documentation.
>
> Here are some more suggestions for chagnes in the Look pane: Instead of writing "Paragraphs are told apart by", just present two setting with cm: Indent first line and Space between paragraphs. Are the settings for the Long quotations only for the quotations that are transformed into quotations? That would be strange. Should they not just be styled as any other paragraph with the quotation kind? Or have I misunderstood? If these settigs are needed here, I suggest that the heading should just be "Quotations", and the "When a quatation is set off" should be "Warn about long inline quotations". It is also confising that the kinds of paragraphs and of words come under the same heading. Who can know what is a kind of paragraph or a kind of word here? "Runs into the text" should be called "Begins the paragraph". "Begins" should then just be "Placement". The heading "Numbers" should be "Line numbers". The preview "As it stands" for figure and table captions is uneccesary. I don't understand what is meant by "The table itself". It looks like the heading "Front page" is smaller than "Equations". "What is shown" should be "Include". "Without the names of the authors" should be "Anonymize the front page". This should also make sure that the identifying information is left out of the metadata of whatever exported version of the document.  Her we could perhaps use "Formatting" instead of "How it is set"? Instead of "What the document contains" write " "Parts of document type", and "Moveable parts" for "The pars of the document" and "Placed parts" instead of "Elements with a place of their own". I still disagree that some elements should be hard coded with either printed front or back. This should be up to the layout, even though the abstract often is placed in front, and appendix in the back. But here "you" have decided that "Acknowledgements" are always printed in the back, which is often not the case. Why do we need to introduce the distinction between front and back matter? "What is required" should be "Requirements of document type". It looks strange to have "The layout" as a heading for a section with only one element "Layout". Let the heading be "Layout" and the option "Choose a layout". "What this document changes" should be "Modifications to the Template", or is it "Layout"?. Remove the "Where the requirements are from" section.
>
> In the Loose Ciations in the document pane, say "Plain text citations" instead of "What is taken for citations". Remove the "What a program made, and tags".
>
> I think this is it for now. Please tell me if anything is unclear, or if you have reservations about any of my suggestions. If not, make a plan for Opus 5.5 to implement this.

The assessment, in short: *Stand for another element* lets one element print another element's tree in its place, which is how a book is assembled from chapters kept elsewhere in the project, and the only way a text can be printed in two documents; it is kept until the owner says otherwise. *Print the name as a heading* goes, and the flag behind it is no longer read. The rows under *Long quotations* are nothing but the base look of the kind Quotation, which the kinds list sets too, so they go, and the two thresholds under them, which did nothing, become a warning of the checklist. The order of the parts is the document type's already (its contents list; Bloomsbury's type prints the acknowledgements in the front); the catalogue's front and back are only the fallback for a kind the type does not place, the grouping of a menu and the words "printed at the back", and these words go: the parts are shown in one list in print order. The metadata of every export is already without the authors while the front page is anonymous; the checklist will say so where a type requires it and the switch is off. The help texts of the named menus and all of Look go, the renamings are taken as asked, the lengths are shown in centimetres. No help text was found on a *New reference* button.

What this settles (ADR 0065, proposed; to be built from `docs/plans/fewer-words-the-top-row-the-menus-and-the-look-pane.md`):

- The list's button takes the owl's place at the top of the rail; each side's × stands in the top row at the right end of its cell, before Split view; Split view has a background of its own; no count of projects on a folder.
- No help texts in the diagram's and the element's menus, nor anywhere in Look; *Print the name as a heading* goes.
- Look in plain words: two lengths for paragraphs, in centimetres; *Quotations* as a warning; *Paragraph kinds* and *Words kinds* apart; *Begins the paragraph*, *Placement*, *Line numbers*, *Inside the table*, *Include*, *Formatting*, *Anonymize the front page*; the parts of the document type in one list in print order; *Requirements of the document type*; *Layout*, *Choose a layout*, *Modifications to the layout*; the source of a layout's requirements out of Look.
- *Plain text citations* in the loose citations, without the line about programs and tags.
- The three things left: *image* for *picture* everywhere the user reads, Escape closes any menu, and a script for the review that closes when the other side takes the focus.

The owner's answers, the same day:

> We keep the "Stand for", but the terminology must change. Let us instead call it "Clone other element". A cloned element cannot have its own text or its own sub elements. Or do you think there are reasons to allow that? It seems to be quite random how this would be handled. Now, a cloned element only appear where it is cloned. If the cloned element is also a part of the document, it should appear at its own place as well as where it is cloned. Does this sound ok?
>
> Why not count lines for the quotation number of lines threshold? Because we don't know how many lines the quotation will have?
>
> No, remove the "As it will stand" for equations also.
>
> We do not care about projects and documents already made. No real work has been done on Glaukopis yet. It is nice if the testing projects don't break, but it is not worth using much work or energy on. So removing "Print the name as a heading" will be fine.
>
> In the library, a pulldown menu appears if you click on the down arrow on the right side of the new reference button. There are two help texts there to be removed. Instead of the BibTex help texts, make the choice "Import Bib(La)Tex. Place "Import from Zotero" right under it.
>
> Here are some more suggestions for adjustments:
>
> The opposite of fold should be unfold. In the contex menu, "Open it" should be "Unfold this element". "Open all that is folded under it" should be "Unfold all sub-elements". "Fold it away" should be "Fold this element". "Fold away all under it" should be "Fold all sub-elements". "Add an element under it" should be "Add child element". "Add an element after it" should be "Add sibling element". "Say when it is..." and "When it is..." should be "Time stamp...". "Delete, keeping what is under it" should be "Delete and promote content". "Delete" should be "Delete with content".
>
> Consider these suggestions, and tell me what you think, and whether you have reservations or better suggestions. If not, remake the plan.

The assessment: the original already prints at its own place as well as where it is cloned; today the standing element may have text and sub-elements of its own, which print around the original's tree, and nothing needs that: a clone has none, shows the original's name and cannot be renamed. Lines are known only after typesetting; the checklist estimates them from the layout's measure and type size. The library's menu is found and reworded. The renamings are taken, with *sub-elements* in place of *content* in the two delete items, plain *Delete* where there are none, and *Time stamp…* as asked with *Place in time…* offered instead; the text menu's four help texts go with the rest. The record and the plan are remade accordingly.

The owner's word on the last three:

> 1. Time stamp. 2. sub-element it is. 3. Let the clones have their own names, so their title in the document can be different from the original. But no content or children. Other than that, do the plan.

## 2026-10-24 — the settings window in plain words, the preview's zoom, keys for the kinds, and five faults

> Also remove the help texts from the settings window. "New projects open in" should be "Default view for new projects". "What new documents are" is "Default document type" and then also "Default look" and "Default citation style". I made a new project. I have set the Document type, look and style on the settings. I want to reset them. Or at least, when I choose another document type, change the look and style to its defaults. "Name what a line of the preview is" should be "Display look chips in the preview window". Keep the Hunspell help message. The Fraktur (Gothic type) should say which language(s) it is trained on. The Your details fields have double borders around them.
>
> The preview window should be zoomable. In the Look pane, under paragraph kinds, choosing small capitals in letters shows normal letters. When changing the Text kind and other kinds, the kind box closes everytime one thing is changed. It does not happen with for example the Speaker kind.
>
> In the text view, I would prefer that none of the kinds are indented, except Quotation, Code and Attribution. Tell me if other kinds need to be indented.
>
> Each dokument type should have its own custom keyboard shortcuts for choosing kinds. What about ctrl+alt+0-9? Let it be possible to reassign kinds to these shortcuts in the Looks pane.
>
> The preview and export to pdf do not reflect the manually changed line numbering. In export to Word and Libreoffice, it works. The export to pdf, set by LaTeX failed with the message "LaTeX failed: Package babel Error: Unknown option 'norsk'.".
>
> Look at these comments, and say what you think about them.

Then: "Remove help texts from the table, from the kinds menus, the reference pane's duplicate, the prefix and suffix help text, under add a folder, from the line numbering menu. I did not see a help text in loose citations. Take away the "forget what you accepted" help text too." (done the same day); "The line numbers that are not displayed are only those I set manually in the margin. The others work as they should. I have now installed all the texlive language packages. Is it possible to make it use the norwegian babel when it is there, and not fail if it isn't?"; and a picture of the text of Antigone beside its page, the numbers 7, 5 and 9 given by hand in the text and missing on the page, 10 and 15 on both. Then: "Please make the plan, and I will hand it over to Opus 5.5."

The assessment, and what was found: the settings' three defaults cannot be unset because their choosers have no "none", and a default look applies only where the document type brings no layout; Typst sets small capitals only from the font's own, and Times New Roman has none, while the text view fakes them; the kind boxes of Look do not remember being open; the text view indents eleven kinds by its cues; Ctrl+Alt+digits is the convention of Word and Google Docs, and the key dispatcher already lets AltGr through; babel takes Norwegian from its own locale files with the option `provide=*`, with or without the language package, and the result is the same; a number given on a later line of a text paragraph is placed by Typst from a position asked before the line break is laid out, so that it falls off the page, and an empty box before the placement mends it (tested with the lines of Antigone). Record 0066 and the plan `docs/plans/settings-zoom-keys-for-kinds-and-five-faults.md` follow.

## 2026-10-24 — the translators, the shared lines of drama, the numbering of lines in two windows, and the bracket

> We are working on the user interface of Glaukopis. We have come quite far, and things are looking good. But I have some more tweeks that I think should be done.
>
> Translator as a document detail. I am translating ancient texts, and for such translations the common way is to have a title like "Aristophanes: Lysistrata" or "Lysistrata by Aristophanes", and hold the author field empty. Then, there is a translator field in place of the author field, and on the title page you get "translated by ..." or "oversatt av ..." in Norwegian. Also for translations of modern works the translator field should be used, but then the author field is also filled out. Please implement this as a general thing, not something accomodating my specific need, which I am just mentioning as an example. Do not introduce more help texts in the menus and dialogs. The labels should speak for themselves.
>
> Also, when I translate Greek drama, some lines are shared by two or more speakers. Then the normal thing is to let the speech that starts in the middle of a line, have an indent so it aligns with the end of the previous speech. How do you propose to do that? Also here, the solution should be a general way to specify indents, not a specific new function tailored to this specific fringe situation.
>
> The line numbering dialog is very confusing. First of all, get rid of the help texts. And the dialog should be split in two, with two menu items: "Line numbering from here" and "Numbering of this line". When displaying every 5th number from a line, and that line is number 1, its number should not be displayed. It would be the same if we start from 41, then 41 should not be displayed, and 45 is the first line number in that run. In the line number from here dialog, there should be an option to number only text with one paragraph kind, with a dropdown of kinds. When setting the numbers in the margin manually, the numbering after ignors it if the number contains letters. If it says "11b" the next line should be counted as "12". "Words in the margin" should be renamed "Annotation in the right margin".
>
> Sometimes the lines in the margin that shows which kind the paragraphs are get unaligned, so a part of it jumps further into the page, and for for example runs over the line numbers. I have not been able to understand exactly when it happens.
>
> Tell me what you think of my concerns and suggestions. Please come with other suggestions, if you think it can be done better than what I propose. If not, make a plan that I can give to Opus 5.5.

The assessment, and what was found: the details of a document have no place for a translator, and the title page is made in one place for Word, Writer, LaTeX and the web and by show rules for Typst, so a translators field with a line *Translated by …* in the language of the document (the words a document prints already come from `document.ftl` per language) reaches every kind of document; a header item, a Look switch and the Org property come with it. The second half of a shared line cannot be aligned by any length, since the first half's width depends on its words and the font: the proposal is a setting of the line, *Begins where the line before ended*, measured on the page (Typst, LaTeX, the web) and in the text view, approximated with non-breaking spaces in Word and Writer, with the step of Tab made a length of the layout (*Indentation step*) and steps honoured on the page for every kind, where today only lists and verse take them. The window of the numbers becomes two, *Line numbering from here* (from the cursor's paragraph on, with *Count the lines of* one kind) and *Numbering of this line* (*Counted*, *Its number is shown: As the others are / Always / Never*, *Annotation in the right margin*, named by the side); a number given by hand follows *every* unless it holds letters, so 1 and 41 are not shown and 5 and 45 are; the count after *11b* is 12 in both counters already, with tests, so the owner's case is to be reproduced first. The bracket jumps because its segments are moved out past the numbers paragraph by paragraph, only on paragraphs that lie in a numbered stretch, while the bracket is drawn along the run; a run of text that is numbered in part draws a bracket along every paragraph of text standing together, with the unnumbered segments 3 em further in. Record 0067 and the plan `docs/plans/translators-where-a-line-begins-and-the-numbering-of-lines.md` follow.

The owner, on the assessment: "I think the list of authors in the document should be a list of contributers, with roles, author, editor, translator. No reason to implement this later, when now is possible. The uncounted option is in the same dialog, so let the user decide which of the partial lines are uncounted (if any). There are different traditions, some count the first part, some the last. An approximately right amount of spaces is the best way to implement it for word and libreoffice. This is how the page setters at my publisher want to have it. When I tried, the annotations were shown on the right side, also when the numbering was on the left side. Should it be an option, perhaps? Please resolve my questions and suggestions, and adjust the plan."

Resolved: the authors become contributors with roles (author, editor, translator), one list, with *Edited by* and *Translated by* lines on the title page in the document's language, items for the header and footer, three Org properties; the setting-in of a line leaves the count alone, which the line's window decides; spaces for Word and Writer stand; the annotations stand across from the numbers by design (what the owner saw), and their side becomes a choice of the layout in Look, *Annotations on the: Other side from the numbers / Left / Right*, outside the numbers where on their side. The record was renamed and the plan with it: `docs/adr/0067-the-contributors-of-a-document-where-a-line-begins-the-numbering-of-lines-in-two-windows-and-the-bracket.md`, `docs/plans/contributors-where-a-line-begins-and-the-numbering-of-lines.md`.

## 2026-10-26 — the diagram as a picture, and the formats of mind maps

> Could you make a plan for adding two more export formats? Diagram as svg and Diagram as image? By the way, are there any other well known mind map formats that we could import and export? Say what you think, and make a plan that I can give to Opus 5.5.

The assessment, and what was found: the diagram is drawn by the page, not by the core (boxes placed by `layout.ts`, lines and curves in one SVG, names as HTML with the four marks a name can have, the marks of status, text, clone and left-out, the fold badge; the colours are the theme's tokens; the fonts Literata and Inter come with the application, split by range of letters), so the picture is best drawn from the screen itself, as a small SVG writer that reads the boxes, the line boxes of the names and the icons as they stand, with the fonts put into the file, and the image made from that SVG in the page at two pixels a pixel; the items belong to the diagram's own menu, the Export dialog being the document's. Of the formats of mind maps, the file of Freeplane and FreeMind (`.mm`) is the one nearly every program reads and writes, XMind the one most used, and OPML the outline format that outliners share and that Glaukopis already reads as a document; MindManager, iThoughts, SimpleMind, MindNode, MindMeister, Scapple and the text diagrams (Mermaid, PlantUML) are not worth their menu items. Record 0068 and the plan `docs/plans/the-diagram-as-a-picture-and-the-formats-of-mind-maps.md` follow; the formats are stages the owner may strike.

## 2026-10-26 — a file in a view

> Can we make a pdf-viewer that can be in a view instead of a map?

The assessment: the core draws PDF pages already (for the window of a reading, in a child process with bounds), and has the text of every page with the place of each line, which the typesetting pane lays over its pages for copying; the library keeps the files and knows their references and the printed number of each page. So a viewer needs no new engine. The first proposal tied the file to the side's project, so that the path, the document pane and the typesetting pane had something to show; the owner:

> I am not sure. Having a file in a side while the side still has its map seems confusing, or have I misunderstood you? I think it would be much clearer if any view, split or not, can show either a map or a file, and the view then is not linked to a map. I think your ideas of remembering the relation between a map made from a pdf and its pdf, and opening the file of a reference, are nice.

Then, on the proposal of a File button beside Diagram, Text and Timeline, and of the page marks of a map read from a PDF opening the PDF:

> I think the diagram, tex, timeline buttons belong to a map, and adding a file button would be confusing. A file is shown in the active view when it is selected in the library, a reference or images window. When displayed from the split view, it will appear in the new view, of course. And when it is opened from a citation, it will open in the other view. I think we will abandon the idea that there is a connection between a pdf and the map made from it. It is enticint, but I see no real use for it. What do you think?

Agreed, with one amendment: selecting a file in the library opens its pane, where it is renamed and moved, so showing is an act, a double-click, Enter, or *Show* at the head of the pane, and *Open it* becomes *Open in another program*. And on "coming back" to the map:

> What do you mean by coming back? When a file is in a view, the map is gone, bit can opened, in any view in the way maps are opened. It should not reappear when the file view is closed. That should close the view, as always.

> great, do it.

Record 0069 and the plan `docs/plans/a-file-in-a-view.md` follow.

## 2026-10-27 — one place for files

> I think the separate place of files and images is somewhat unintuitive. The files menu in the library just lists all the files that has been imported to the project, except the image files, which gets its own pane. Should we not just have one files pane, where all files are listed, no matter where it was imported from? You have advised me against this before, but I still cannot see why the way it is now is better. The files pane would need to be organized some way, perhaps, three categories: pdf, image and other? Or just be like a normal file manager, where you can sort on file type, date, or file name? What do you think?

The assessment agreed: the two stores were divided by their storage (a picture is material of a document, shared and carried in the project file; a file is a source, private, belonging to references), and that reasoning should not have decided what the writer sees; the same image lands in either store by the way it came in, with nothing between the copies. Proposed: one Files view shaped like a plain file manager, folders, sorting by name, kind and date, a filter row rather than three fixed groups, *where it is used* as the extra fact, the image's extras in its pane, the project's picture panel kept, sharing following use. Then:

> I am not sure about the image caption. Images may be used in many documents, and would probably need different captions (or none) in each document. So, should not the caption stay with the document, not the image itself? Also, images now have a note field, while other files do not. Adding a notes field to pdfs would create some confusion, since also a reference has a note field, so a user may forget if she added a note to the pdf or the reference of a work. Should we just remove the image note? Or do you have another suggestion?

Agreed on both: the image's caption was only a starting point copied into each figure, and the field says otherwise; it goes, and a figure's caption is the document's. The image's note goes too, the store's and the project's under `picture:<hash>`; notes belong to works, and what there is to say of a file is said on its reference. The alternative text stays with the file: it says what the image shows, the same wherever it is used.

> Nobody has made an image note yet, that needs to be saved, so just discard them. I am unsure that we should allow notes even to files that have no reference. That will cause confusion if the file is ever added to references, don't you think? I also have some ideas and questions about the files view. It would be good to have a well functioning preview function for all supported files, and different listing modes, like thumbnails in different sizes and a list view, with or without recursion. What do you think?

Resolved: no notes on files at all; a file that deserves a note is given a reference first. A preview in the file's pane (an image as it is, a PDF by its first page, drawn once and kept), a list and a grid of thumbnails in three sizes, a switch *Include subfolders*, sorting in both modes.

> Yes, make the plan. I will give it to Opus 5.5, so please make sure it is detailed enough, and that it points to the files that will be part of the plan.

Record 0070 and the plan `docs/plans/one-place-for-files.md` follow.

## 2026-10-28 — a simple image editor

> I have been thinking that it would be very helpful for Glaukopis to have a simple image editor. It does not need to be very advanced, but rotating, cropping, some colour functions, like contrast, brightness and saturation would be nice to have. How hard would it be to implement something like this?

Assessed as a modest job: the core already has the `image` crate with turns, flips, crops and colour operations; the library already makes copies of an image without touching the original, recorded as made from it; the viewer already shows an image at a zoom. Proposed: a live preview in the page by the browser's own filters and transforms, one command in Rust that applies the same settings to the full image and keeps the result as a new file made from the old; the open question being what happens to the figures that show the old file.

> I think the user must change the image into the edited version manually. Remember, an image can be a figure in many different documents, so automatically changing it would need to change it in all places, right? That is probably not what the user intends in most cases. When a user wants to edit a very large image, should we perhaps tell the user that the image is too big to be edited, and offer to make a scaled down copy of it?

Agreed on the first: the edited image is a new file beside the old, no figure follows it, and the writer swaps a figure for it by hand, document by document, the pane and the figure's panel making that one step. On the second, separated: the preview is what stalls on a big image, and it works on a scaled-down version, while the apply runs on the full image in Rust, so that a scan keeps the resolution print wants; only a file above the limit figures already have, 50 MB, is refused, with the offer of a smaller copy. Also proposed: an edit of an edited copy starts from the file in view and records it as what it was made from.

> I misunderstood you. I agree, we should not impose limits that are not necessary. And, yes, the source of a copy is the image it is based on, whether the base is a copy or not. Make the plan so I can give it to Opus 5.5.

Record 0071 and the plan `docs/plans/a-simple-image-editor.md` follow.

## 2026-10-29 — sources in tabs, bookmarks in a file, and the scrolling of pages

> I have tryed out the new file (pdf/image) viewer in Glaukopis, and I realize that it needs some changes to the implementation. For many types of text, I constantly need to look up in different pdfs of books and articles. That is why I thought it would be nice to have a pdf view beside the text view while working on the text. But it is cumbersome to go and change which pdf is shown every time I need another text. Sometimes I also want to switch between several places in the same pdf. I think it would be great to have a set of files connected to the project, and that these can be selected from tabs in the pdf/image view. So, instead of just viewing a new pdf from the files list, it should be added to the project's files. This list should be remembered, and even the place in each pdf in each tab should be remembered, so that if I have the same pdf open in two tabs, the tabs remember the place of each. Additionally, it should be possible to add bookmark to pdfs. The bookmarks should pertain to the pdf file itself, and not just the tab of the project, so a bookmark in a pdf will still be there in another project. These, as well as pdfs in general, are not shared between projects. One other thing. I find that scrolling pdfs is lagging much more than in other pdf viewers. Do you think it is possible to optimize it? What do you think about this idea? Please tell me if something is unclear, or if you think it should be done in a different way.

Assessed as sound, with one change of shape: the tabs are the list itself, each a place in a file, and the files connected to a project are those its tabs show; the list kept in the project's own memory of how it was looked at, on this computer alone; a file side belonging to the project beside it, which reverses a choice of 0069; bookmarks in the library's record of the file, the same in every project; the file's own table of contents, which the core reads already, offered beside them. The lag traced in the code and the cache: every page crossing the bridge as base64 inside JSON (1.7 MB a page as PNG, 2.2 MB as text, some 11 MB a batch parsed on the page's thread), every batch of uncached pages starting a child that parses the whole file again, up to forty pages kept as strings, pages drawn at a width rounded up and scaled at every paint, the text layer forcing a layout per line, PNG at the slow default compression. Five things to confirm: local only; the tabs follow the project in the other side; a file shown again goes to its tab, a second tab made on purpose; a bookmark keeps page and position, not zoom; the file's contents beside the bookmarks.

> Just one quetion. What if there is no project up, but only the document. How should we handle that? Tabs from the last open project? Or do you have another idea?

Answered: yes, the last project, but the side has to say so. A file side belongs to a project and names it in the top row; it gets its project when it opens, the one beside it or the one the window was last in; it keeps it when the map side closes; when a project opens in the other side again the tabs follow it, and the cell names the new one. With no project at all, the tabs are the window's own, under no name. What the rule costs: one cannot read A's sources beside B's text.

> Yes to all. Make the plan.

Record 0072 and the plan `docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md` follow.

## 2026-10-29 — the tabs opened, files by their references, and a file read in the library

> Now I have a project with a files' view with 2 pdf files. It is not clear at all how I can open the files view without adding a new file to the project. Also, I think it would be nice if it was possible to show the files in the files list by author(s)/editor(s)/translator(s), year, title or publisher, at least where the reference has been found. Also, moving an image or pdf to the preview window for files is to small. I have to open it in order to read the author and title etc. to create a new reference, but then it is moved into the active project, which is usually not what I want, while I am just creating a reference for it.

Proposed: an item of Split view that opens the file side of the project beside the text with its tabs as they were; the files list with columns for the people with their role, the year, the title and the publisher where the file belongs to a reference, each sortable, and the same words naming the file in the tabs, the chooser and the tree; and a reading column in the files view, the file shown large with the viewer of the window, nothing of the window's sides touched.

> Yes to all, but should not "Show" then be renamed something like "Add to project tabs"?

Agreed: the act is named for what it does. A double-click or Enter among the files reads the file; adding to the tabs is a deliberate act.

> Sources is not a good name for the list. The pdfs will often not be sources but reference material like dictionaries etc. We should not use language that restricts the possible usages of the function.

Agreed: the row of tabs and the acts are named for what they are, *tabs*, in every word the user sees; the record of 2026-10-29 on sources in tabs keeps its name, and the code its inner names.

> I also think it should be remembered whether a project files' tabbed view was open or not last time the project was open. This goes against an earlier decision, but now the view belongs to the project, so I think it makes more sense. I am not sure about other constellations. Two different project views should not be remembered the next time one of the projects are opened (but still be remembered if they were open when Glaukopis was closed). But perhaps it makes sense remember it if the same project is in both views. That reflects a mode of working, I guess. Perhaps there should be an option for what happens in such cases? What do you think.

Proposed, and agreed ("I agree. Make the adjustments."): one rule and no option. A project remembers how it was shown when it was left, alone, with its tabs beside it, or both ways at their elements, and comes back that way when it is opened from the list, provided the other side is free, empty or showing tabs; another project's map stays. The window as a whole is still laid out as it was left when Glaukopis starts. A project opened at an element, from a citation or the search, still brings its other side. This revises the decision of 2026-10-23 that a project remembers only where it was left.

Record 0073 and the plan `docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md` follow.

## 2026-10-30 — files by their references, named by them on request, and a menu of projects for the tabs

> I am not sure it is helpful to see the filename of the files everywhere. The author, year and title are the interesting information. I think also, there should be an option to rename the pdfs to author(s) last name, year and title. A lot of repositories of articles and books come with nonsense names, so that could be useful. When hovering the mouse pointer over the pdf imaga, it has a form of a magnifying glass. Then I expect that clicking the preview will magnify it. Instead it opens it, which of course is what it should do, but the pointer's form should be something that points towards that. I also suggest that instead of jumping to the project page when adding a file to a project, the add button opens a menu of projects which it can add the file to, and that it does not automatically change page to the project in question. What do you think?

Proposed: the list and the thumbnails show a file by its reference where it has one, as the tabs, the chooser and the tree do already, the file's own name only where the work has another file to tell it from; the pane names the file by its reference at its head and keeps the name among the facts, where it can still be changed; *Name by the reference*, an act of its own on one file or many, giving the name the core gives a file attached from a reference and an exported file, *Nagy 1979 - The Best of the Achaeans*; a hand over the preview; and *Add to a project's tabs…* opening a menu of projects, the file added to the one chosen without leaving the files view, a notice saying so with *Show* in it. Two questions: whether the name should follow the reference by itself when a file is assigned, and whether a file named by its reference may still be renamed by hand.

> I think renaming files should be a separate function, run manually. Files should possible be renamable.

Agreed: naming by the reference is an act run by hand, never a consequence of assigning; every file stays renamable. Record 0074 and the plan `docs/plans/files-by-their-references-named-on-request-and-a-menu-of-projects-for-the-tabs.md` follow.

> One question first. The add a file on the tabbar and the add a file to the tabs in the split menu, should be multiple choice. Is that part of the plan?

It was not; it is now. The chooser under the plus and in Split view's menu lets several PDFs and images be chosen, as the chooser of a reference's files does already, the button saying how many it adds; all go to the tabs in the order chosen, the last shown; files already among the tabs are not offered. The words become *Add files to the tabs…*. The record and the plan carry it.
