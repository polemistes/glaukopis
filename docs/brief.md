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
