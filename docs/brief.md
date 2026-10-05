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
