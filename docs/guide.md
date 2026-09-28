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
**Cite**, **Note** and **Insert**, which has pictures and mathematics. They
act where the cursor is. The same tools are in
the box that opens when an element is double-clicked in the diagram, and a
bar with them appears over whatever you select.

Everything the tools do can be done from the keys, and much of it by typing:

| To | Do this |
| --- | --- |
| Cite a reference | **Cite**, or type **@**, and begin to type an author or a title |
| Give the page | Type it when the citation has been chosen: `73`, `73–75` |
| Write a note | **Note**, or **Ctrl+Alt+F** |
| Put in a picture | **Insert**, or **Ctrl+Alt+P**; or drop the file on the text; or paste |
| Write a formula in the line | **Insert**, or **Ctrl+Alt+M** |
| Write an equation on a line of its own | **Insert**, or **Ctrl+Alt+E** |
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

### Figures

A *picture* is a file: a photograph, a drawing. A *figure* is a picture as
it stands in a text, with what is said of it there, its caption, and its
number in the document. The same picture can be a figure in many texts.

Put a figure in with **Insert**, from a file or from the store of pictures;
by dropping a file on the text where it is to stand; by pasting a picture
that was copied; or by dragging a picture from the pictures beside the map
(see *Pictures* below). A picture dropped
on an element in the diagram becomes a figure at the end of its text.

What is said of the figure is written under the picture, where the cursor is
when the figure has been put in. It can hold citations and formulas. **Enter**
leaves the figure, and the writing goes on under it.

Pressing the picture opens the rest that can be said of it:

- **How wide it is**, as a share of the width of the text in the document.
- **Where it stands**: to the left, in the middle or to the right; and, of a
  figure at a side, whether **the text flows around it**. See *Where things
  stand* below.
- **What it shows**, in words, for those who cannot see it. This goes into
  the documents that can hold it.
- Whether it is **numbered**. The figures are numbered through the document:
  the number shown where you write is the one the figure has there.
- **Keep the caption with the picture**, so that figures made with the same
  picture later begin with the same words; and **Use the picture's own**,
  which says of this figure what is kept with the picture.
- **Another picture** in its place, or the figure removed.

The word before the number, where what is said of the figure stands and how
it is set, are said by the document format: *Figure 1.* under the picture in
one, **Figure 1** over it in another. A format can also have the figures
gathered at the end of the document, as many journals ask of a manuscript;
a line in the text then says where each belongs.

PNG, JPEG and SVG are kept as they are. GIF, WebP, TIFF and BMP are made
into PNG when they are put in, since not every kind of document can hold
them. One picture may hold 50 MB.

### Mathematics

Mathematics is written in the notation of TeX, which is what journals and
publishers take: `x_i` is *x* with a lowered *i*, `\frac{1}{2}` a half. It
is written in a small panel, which shows what is written as it will stand
while you write, and says so when it cannot be read. The signs that are most
often wanted are in the panel, to be put in by pressing them; what is
selected goes into what is put in.

A **formula** stands in the line, among the words. An **equation** stands on
a line of its own, and can be numbered; what stands around the number,
as in (1), is said by the document format. Pressing either opens it again.

### Where things stand

A figure, a table and an equation each stand to the left, in the middle or
to the right. The text can flow around a figure or a table that stands at a
side, as it does in books; in the middle, nothing flows around it.

What the document format says holds for all of them: a format may have its
figures in the middle and its tables at the left margin. Of any one of them
you can say something else, in the panel that opens when it is pressed;
**As the format** takes what you said back. The panel tells what the format
says.

Several can stand **beside each other**: open the panel of the second, and
choose **Put it beside the one before it**. A third and a fourth can join
them. Each has its share of the width, its own caption and its own number;
the pictures stand with their feet on one line. **By itself again** takes
one out of the row.

Where you write, things stand as they will in the document. How the text
breaks around a figure differs a little between the kinds of document, as
each has its own way of doing it; the PDF that is set by Typst is what the
preview shows.

### Pointing to figures, equations and parts

Where the text says *see figure 2*, the number should follow the figure: if
another figure is put in before it, the text is to say *figure 3*. Write
such words with **Insert › Pointer…**, or **Ctrl+Alt+R**, and choose what
they point to: a figure, a numbered equation, or a part of the document,
which is an element whose name is printed as a heading. They can be found
by what is said of them.

The words then say what the document calls the thing:

- a **figure** by the word the format has for it and its number, *Figure 2*,
  or by the number alone;
- an **equation** by its number as it stands beside it, *(1)*, or by the
  number alone;
- a **part** by its number where the format numbers the headings, *2.1*, and
  by its name where it does not, or whenever you choose the name.

Words like *see* and *section* you write yourself. Press the pointer to
change how it points, to go to what it points to, or to point it elsewhere.

In a PDF and on a web page the words lead to what they point to when they
are pressed. If what they point to is taken away, or left out of the
document, they are shown as **?** in red where you write and as **[?]** in
the document, and the preview remarks on it.

## Pictures

Pictures are kept in one store for the whole of Glaukopis, as references are
kept in the library. A picture that is used in several texts, maps or
projects is the same picture in all of them, and is kept once.

**Ctrl+3**, or the pictures in the rail at the left, shows the store: every
picture, to be searched by what it is called and by what is said of it. Add
pictures with **Add pictures…**, or drop files on the view.

In a project, **Ctrl+Shift+P** opens the pictures beside the map, where the
references are otherwise. They can be shown for **this map**, for the
**project**, or for the whole **store**. Drag one into a text to make a
figure of it there.

Of each picture you can say:

- what it is **called**;
- its **caption**: what figures made with it begin with. What is said of a
  figure can be changed where the figure stands, without changing this;
- what it **shows**, in words, for those who cannot see it;
- **notes**, which are for you, and are part of no document. As with
  references, a note is for all projects when it is written in the store,
  and for the project when it is written in a project, where it is with
  everyone the project is shared with, until you keep it for all projects.

The store also says in which projects a picture is used. A picture that is
removed from the store leaves the figures made with it without a picture.

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

### A map from a document you have written

A text that was written elsewhere can be brought in, and becomes a map of its
own. The file it came from is read and not changed.

- In a project, the button beside **+** over the map, **A map from a
  document…**, or drop the file on the window.
- Among the projects, **A project from a document…**, or drop the file
  there. The project is named after the document.

The title becomes the centre of the map. Every heading becomes an element
under the heading above it, with the text under the heading as its text; what
stands before the first heading becomes the text of the centre. Author, date,
abstract, keywords and language go where the document of the map has them.

Before anything is made you are shown what was found: the title, which you
can change, how many parts, words, notes, figures, tables and citations, and
under **To know** what could not be brought in as it was. **Cancel** leaves
everything as it was; **Undo** takes the map away again as one step.

| Kind of file | Endings |
| --- | --- |
| Word | `.docx` |
| OpenDocument | `.odt` |
| Markdown | `.md`, `.markdown` |
| HTML | `.html`, `.htm` |
| LaTeX | `.tex` |
| Rich Text | `.rtf` |
| EPUB | `.epub` |
| Org, reStructuredText, Typst | `.org`, `.rst`, `.typ` |
| Plain text | `.txt` |

AsciiDoc, DocBook, JATS, FictionBook, OPML, MediaWiki, Textile, Djot, Muse
and Jupyter notebooks can be chosen in the dialog for files as well. All but
plain text are read by Pandoc.

What becomes of what is in the document:

- **Notes** become notes. A note on a heading stands at the beginning of the
  text under it.
- **Pictures** are taken into the store of pictures, and stand in the text as
  figures, with what is said of them. A picture that is to be fetched from
  the network is left out: nothing is fetched.
- **Tables** become tables, with their headings, cells that span, and what
  is said of them.
- **Mathematics** is kept as it is written, in the line or as equations.
- **Citations** written by key (Markdown `[@homer]`, LaTeX `\cite{homer}`)
  become citations when the key is in your library, with page and words
  before and after. Those that are not, and citations in Word and
  OpenDocument files, stay the text they were written as.
- **A list of works cited** is brought in as text. The map makes its own
  from what is cited in it, so the part can be left out of the document or
  deleted.
- **Code, lists of terms, lines across the page** and what is written for
  one kind of document only have no place in a map: what has text is kept as
  paragraphs, the rest is left out, and you are told.

A Word file with changes that are tracked is brought in as it stands when
all of them are accepted; comments in the margin are left out. You are told
of both. OpenDocument files lose their
mathematics in the reading, which is a limit of Pandoc.

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
a web page. Where the document is given as it is written, in LaTeX, Typst or
Markdown, its pictures are put in a folder beside it, named after it.

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
The pictures of the figures of the project are shared: they are sent to the
server when they are put in, and fetched by the others from there, into
their own stores. No other picture of your store is sent. A picture that
has not arrived yet is shown as an empty frame until it has.

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
| **Ctrl+1**, **Ctrl+2**, **Ctrl+3** | The projects, the library, the pictures |
| **Ctrl+,** | Settings |
| **Ctrl+D** | Diagram or text |
| **Ctrl+P** | The preview |
| **Ctrl+Shift+R** | The references of the map |
| **Ctrl+Shift+P** | The pictures of the map |
| **Ctrl+Z**, **Ctrl+Shift+Z** | Undo, redo |
| **Tab**, **Enter** | In the diagram: a new element under, or beside |
| **F2** | Rename |
| **@** | In the text: cite |
| **Ctrl+Alt+F** | In the text: a note |
| **Ctrl+Alt+P** | In the text: a picture |
| **Ctrl+Alt+M**, **Ctrl+Alt+E** | In the text: a formula in the line, an equation |
| **Ctrl+Alt+R** | In the text: words that point to a figure, an equation, a part |
| **Ctrl+F**, **Ctrl+N** | In the library: search, new reference |

## What Glaukopis needs

Pandoc makes the documents, and Typst the pages of the preview and the PDF.
Both are installed with Glaukopis when it is installed as a package. Where
they are found is shown under *Settings*.

LaTeX is needed only for the PDF that is set by it. LuaLaTeX is used where
it is installed, since it knows the fonts of the computer and can turn to
another font for letters that the font of the document lacks, such as Greek
with its accents.

A drawing (SVG) in a PDF set by LaTeX, or in a Word document, is made into
what those can hold by `rsvg-convert`, which comes with librsvg and is on
most computers.
