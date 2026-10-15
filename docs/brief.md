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
