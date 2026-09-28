# A guide to Glaukopis

Glaukopis is where the work on an academic book or article is done: collecting
what you have read, working out what you think, writing it, and producing the
manuscript a publisher asks for.

It has two places, reached from the left edge of the window: the **projects**,
one for each book or article, and the **library**, which holds your
references and is the same for all projects.

## The idea

You do not write a document in Glaukopis. You make a **map** of your ideas,
and write into it, and the map *is* the document.

Every idea is an **element** of the map. An element has a name and may have
text. Elements stand under one another: that is the order of the argument.
They may also be *associated* across the map, where one idea bears on another
without belonging under it.

A map can be looked at in three ways, and it is the same map in all of them:

| View | What it is for |
| --- | --- |
| **Diagram** | Seeing the whole, and moving ideas about. |
| **Text** | Writing. The names of the elements are the headings. |
| **Preview** | Seeing the manuscript as it will be sent. |

So there is no moment at which the outline is put away and the writing
begins. An element with a name and nothing else is a thought to come back to;
one with three paragraphs and citations is a section that is nearly done.
Both are in the same map.

## A first project

1. Choose **Begin a project** and give it the working title of the book or
   article. It opens on a map with one element, the centre, named after the
   project.
2. Click the centre and press **Tab**. A new element appears under it: type
   its name and press **Enter**.
3. Press **Enter** again for one beside it, **Tab** for one under it.
4. Double-click an element to write its text.

Everything is saved as you work. There is nothing to press.

## The diagram

| To | Do this |
| --- | --- |
| Add an element under the one selected | **Tab** |
| Add one beside it | **Enter** |
| Write the text of an element | Double-click it |
| Rename an element | **F2**, or begin to type |
| Read its text without opening it | Rest the pointer on it |
| Move an element, with all that is under it | Drag it onto another element |
| Select several | **Shift**-click, or drag a frame around them |
| Delete | **Delete** |
| Undo, redo | **Ctrl+Z**, **Ctrl+Shift+Z** |
| Move about the map | Drag the background; scroll to zoom |
| Everything else | Right-click an element |

Lines between an element and what is under it are straight. **Associations**
are curved. To make one, right-click an element, choose **Associate with…**,
and click the other element. An association can be given a few words that say
what it is.

An element that has text shows a small mark, and the number of works its
text cites.

## The text

**Ctrl+D** turns between the diagram and the text. In the text, each element
is a section: its name is the heading, and the depth of the heading is the
depth of the element in the map.

Write as in any editor. The tools are over the text: the kind of paragraph
(text, quotation, list, numbered list), italics, bold and small capitals,
**Cite** and **Note**. They act where the cursor is. The same tools are in
the box that opens when an element is double-clicked in the diagram, and a
bar with them appears over whatever you select.

Everything the tools do can be done from the keys, and much of it by typing:

| To | Do this |
| --- | --- |
| Cite a reference | **Cite**, or type **@**, and begin to type an author or a title |
| Give the page | Type it when the citation has been chosen: `73`, `73–75` |
| Write a note | **Note**, or **Ctrl+Alt+F** |
| Set words in italics or bold | The tools, or **Ctrl+I**, **Ctrl+B** |
| Begin a quotation or a list | Type `> `, `- ` or `1. ` at the start of a line |
| Make a dash | Type `--` for –, `---` for — |
| Divide an element in two | Right-click where it is to be divided: **Split here** |
| Join an element to the one above | Right-click: **Join to the element above** |

What a sign has done is undone by **Backspace**, should the sign have been
meant as a sign.

Associations are shown as narrow lines in the left margin, between the
sections they join. Click one to go to either end of it, to give it a few
words, or to remove it.

### Notes

A note is written in a small panel that opens where the note stands, and is
shown in the text as its number. In the text of a map the notes are numbered
through the whole map, as they will be in the document. An element that is
left out of the document numbers its own.

Whether notes stand at the foot of the page or at the end of the text is
said by the document format. Some books keep two kinds of notes apart: the
author's remarks at the foot of the page, say, and the sources at the end.
For that, a single note can be set to stand at the other place, in the panel
it is written in. Such notes are lettered, *a*, *b*, *c*, in the text and in
the document, so that they are told from the numbered ones.

## Citations

A citation is not text: it is a link to a reference in your library. How it is
printed, as *(Nagy 1979, 73)*, as a footnote, or as a number, is decided by
the reference style of the document, and changes when the style is changed.

Click a citation to give it more:

- the **page** or another place in the work: chapter, section, verse, line;
- words **before** it, such as *see* or *cf.*;
- words **after** it;
- that the author is named in your sentence, so that only the year is
  given;
- further references, to cite several in one place.

What you cite is thereby among the references of the map and of the
project: there is nothing else to do to put it there. The panel of
references (**Ctrl+Shift+R**) lists them, for this map, for the project, and
the whole library. A reference dragged from the panel is cited where it is
dropped in a text; dropped on an element of the diagram, it is cited at the
end of that element's text.

### What you think of a work

Beside what is cited there is what you make of it: a summary, a doubt, where
it bears on your argument. Such notes belong to the reference, not to the
document. The small notebook that is shown with a reference opens them,
wherever the reference is shown: in the library, in the references of a
project, where a work is chosen to be cited, and in a citation in the text.
Where something is written, the notebook is in view; where nothing is, it
appears when the pointer is near.

There are two kinds:

| | Kept | Seen |
| --- | --- | --- |
| **In all projects** | With the reference, in `library.bib` | Wherever you cite the work |
| **In this project** | In the project | In this project, by everyone it is shared with |

What is written in the library is for all projects. What is written in a
project is for that project, until you choose **Keep it for all projects**.

When a project is shared, the notes you have on the works it cites go with
it. To those you share it with they are notes of the project, to read and to
add to; your own stay as you wrote them.

References are found by what is written about them, as by their authors and
titles.

## The library

The library is one file, `library.bib`, in BibLaTeX. Other tools can read it;
nothing about your references is locked into Glaukopis. Files that belong to
references, such as the PDF of an article, are copied into the library when
they are added. Glaukopis does not depend on where they came from.

**New reference** opens a form with the fields that are usual for the kind of
publication. Other fields are added from **Add field**. The entry as it
stands in the file can be seen and changed with **Edit the source…**, in the
menu of a reference, by those who want to.

References can be added wherever they are used: from the library, from the
picker that **@** opens, and from the panel of references of a map. It is the
same form in all three.

**Collections** gather references for a subject or a piece of work. A
collection holds links, not copies: a reference can be in any number of
collections, and changing it changes it everywhere.

### What is already there

When a reference is added or imported, Glaukopis looks for it in the library.

- It is **the same** if it has the same DOI, or is a whole book with the same
  ISBN, or agrees in everything that tells one work from another.
- It is **probably the same** if title, author and year agree.
- Chapters of one book, editions of one work, and volumes of one set are told
  apart, though they share much.

You are told which, and choose: add it all the same, leave it out, or let the
one that is there take what it lacks from the new one. **Find duplicates…**,
in the menu beside *New reference*, goes through the whole library in the
same way.

### Looking a reference up

The form for a new reference begins with a field to look it up in. Type or
paste one of these, and press **Enter**:

- a **DOI**, as a number or as an address: the details come from the
  registry the DOI belongs to;
- an **ISBN**: the details come from library catalogues;
- **words** of the title and the name of the author, such as *nagy best
  achaeans*: books are looked for in library catalogues, articles at
  Crossref.

What is found fills in the form, which says where the details are from. They
are yours to correct before the reference is added. Of a book there are often
several records, one for each edition: choose the one you have read.

Catalogues are not faultless. Glaukopis mends what it can, such as titles in
capitals, and says what it has mended.

### PDF files

Drop a PDF on the window, or choose **Add PDF files…** in the menu beside
*New reference*. The file is read for a DOI or an ISBN, which is looked up;
the file is then kept in the library with its reference.

A file that says nothing of what it is, such as a scan, is kept under its
name, for you to fill in the details.

Where the file is dropped decides what becomes of it:

| Dropped on | What happens |
| --- | --- |
| The library | A reference is made of it, in the collection in view |
| A reference that is open | The file is attached to that reference |
| An element of a map | A reference is made of it, and cited at the end of the element's text |

### Importing

**Import a file…** reads `.bib` files, BibLaTeX or BibTeX. **Paste
references…** takes entries copied from a web page or another program.

**Import from Zotero…** reads the library that Zotero keeps on this
computer: all of it, or one collection, with the files and the notes if you
wish. Zotero is only read; it may be running meanwhile. Its collections
become collections here.

Before anything is added you are shown what was found and what is already
there. Importing the same a second time adds nothing.

## Several maps

A project can hold several maps. They are the tabs over the map; **+** makes
a new one.

This is what makes it safe to write. A map that is valuable as it is, the
first sketch of the argument, or the plan for the whole book, need not be
consumed by the writing:

- **Duplicate** a map, and write in the copy.
- **New map from this branch** lifts one part of a map out as a map of its
  own: a chapter out of the plan for the book.
- **Copy to map** and **Move to map** take elements from one map to another. A
  copy remembers where it came from.
- An element can have **another map take its place in the document**. The map
  of the book then has one element for each chapter, each of which stands for
  the map of that chapter. The preview of the book shows the book.
- **Two side by side**, in the bar over the map, shows the map as diagram and
  as text beside one another. Click a side and then a tab to show another
  map there; each side can be diagram or text.

The line between the two sides can be dragged, as can those beside the
preview and the references. A double click on a line puts it back.

## What goes into the document

Everything under the centre of a map, in the order of the map. Three things
change that, all in the menu of an element:

- **Print the name as a heading.** When this is off, the name is for you: a
  label for a paragraph, which is printed without it.
- **Leave out of the document.** The element stays in the map, with what is
  under it, and is not printed.
- **Detach from its parent.** The element floats free in the diagram. It
  belongs nowhere yet, and is not printed.

## The preview, and the manuscript

**Ctrl+P** opens the preview beside the map, and closes it. It shows the pages
as they will be, and follows as you write.

Over the preview, two things are chosen:

- The **reference style**: Chicago, MLA, APA, Harvard and other common styles
  come with Glaukopis; any of the ten thousand styles of the Citation Style
  Language can be fetched by name.
- The **document format**: the page, the type, the spacing, the headings, as
  a publisher or a journal asks for them. The formats that come with
  Glaukopis each say where their requirements were found, and when.

Both can be changed. **Change this format…** has every measure of the page in
plain words. **Change this reference style…** has the changes publishers most
often ask for as simple choices, and the whole style, part by part, for the
rest. What you change is kept as a format or a style of your own; those that
came with Glaukopis stay as they were.

**Export** makes the manuscript: PDF, Word, OpenDocument, LaTeX, Markdown, or
a web page.

There are two kinds of PDF. **PDF** is what the preview shows. **PDF, set by
LaTeX** is the same document in the typesetting of LaTeX, for those who
prefer its pages or are asked for them; it needs LaTeX (TeX Live) on the
computer, and takes a little longer. The two are alike in everything the
format says, and differ in how lines and pages are broken.

What there is to remark about a document, such as a font the format asks for
and the computer does not have, is said at the foot of the preview.

Two programs do the work. Pandoc turns the text into the document, and sets
every citation and the bibliography in the reference style. Typst sets the
pages: those of the preview, and those of the PDF, which are the same.

## Working together

A project can be shared, so that several write in it at the same time. This
needs a server, which you or your institution runs: see `server.md`.

**To share a project**, open it and click the two figures at the top right.
Enter the address of the server, and the password of the server if it asks
for one. Then **Make an invitation code**, and send the code and the address
of the server to the one you invite.

**To join a project**, choose **Join a shared project** among the projects,
and enter the address and the code. An invitation that is pasted whole is
taken apart for you.

From then on:

- What one writes is seen by the others at once, with a cursor that carries
  the name of who is writing.
- Those who have the project open are shown at the top right.
- Each has the whole project on their own computer. Without the network, or
  without the server, the work goes on; what was written meanwhile is brought
  together when the server is reached again.
- Undo takes back what you wrote yourself, and leaves what others wrote.
- The one who shared the project can see who has it, remove someone, and stop
  sharing. Those who are removed keep the project as it was then.

Files attached to references are not shared; the references themselves are.

## Keeping things safe

- **Earlier versions.** A version of each project is kept every now and then
  while you work. Right-click a project and choose **Earlier versions…** to
  open one as a project of its own.
- **Deleted projects** can be brought back, from the line under the projects.
- **Everything is in one folder**, shown under *Settings*. To keep a copy of
  your work, copy the folder.
- **To read your text without Glaukopis**, export it. The references are in
  `library.bib` at all times, which other tools can read; the text of a
  project is in a form that only Glaukopis reads.

## Keys

| | |
| --- | --- |
| **Ctrl+1**, **Ctrl+2** | The projects, the library |
| **Ctrl+,** | Settings |
| **Ctrl+D** | Diagram or text |
| **Ctrl+P** | The preview |
| **Ctrl+Shift+R** | The references of the map |
| **Ctrl+Z**, **Ctrl+Shift+Z** | Undo, redo |
| **Tab**, **Enter** | In the diagram: a new element under, or beside |
| **F2** | Rename |
| **@** | In the text: cite |
| **Ctrl+Alt+F** | In the text: a note |
| **Ctrl+F**, **Ctrl+N** | In the library: search, new reference |

## What Glaukopis needs

Pandoc makes the documents, and Typst the pages of the preview and the PDF.
Both are installed with Glaukopis when it is installed as a package. Where
they are found is shown under *Settings*.

LaTeX is needed only for the PDF that is set by it. LuaLaTeX is used where
it is installed, since it knows the fonts of the computer and can turn to
another font for letters that the font of the document lacks, such as Greek
with its accents.
