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

