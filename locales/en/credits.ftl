# The credits of Glaukopis: what it is built on and comes with, with their
# licences, in the window that a button in the About section of the
# settings opens. The names of the projects and their licences are not
# translated: they are in src/lib/settings/credits.ts.

credits-button = Credits and licences…
credits-title = Credits and licences
credits-own-licence = Glaukopis is free software under the GNU General Public License, version 3 or later (GPL-3.0-or-later). It is made with the work of the projects below, under the licences they give.
# Before the authors of a project, where its licence asks for them to be named.
credits-by = By { $who }
# What a name stands for, when it is a link: "Opens { $url }".
credits-open = Opens { $url }

## The groups

credits-group-built-on = What it is built on
credits-group-copied = Code taken into it
credits-group-fonts = Fonts
credits-group-data = Styles, dictionaries and other data
credits-group-programs = Programs it works with, where they are installed
credits-group-icons = Icons
credits-group-owl = The owl
credits-group-lookup = Where references are looked up
credits-lookup-about = DOIs at doi.org, Crossref and DataCite; books in the catalogues K10plus, of the Norwegian academic libraries, of the Deutsche Nationalbibliothek and of the Library of Congress; preprints at arXiv; medical literature at PubMed. Only what you type into the lookup is sent to them.

## What each is to Glaukopis

credits-what-tauri = The frame of the application: its window, and the way between the interface and the rest.
credits-what-tauri-plugins = The windows for choosing files and folders, and opening files and addresses in other programs.
credits-what-webkitgtk = The web engine the interface is shown in, on Linux. It is a part of the system, not of Glaukopis.
credits-what-gtk = What becomes of the window and of the page on Linux, for the log.
credits-what-svelte = The interface is written with it.
credits-what-prosemirror = The editor of texts.
credits-what-yjs = Keeps projects, so that changes can be undone and shared with others as they are made.
credits-what-y-prosemirror = Joins the editor of texts to what a project keeps.
credits-what-y-protocols = The way changes to a shared project go to and from the server.
credits-what-lib0 = Small tools Yjs is built with, and with which the interface writes what it sends to the server.
credits-what-yrs = Keeps shared projects in the server Glaukopis comes with.
credits-what-fractional-indexing = Keeps the order of elements and kinds when several people move them at once.
credits-what-fluent-js = The words of the interface, in every language.
credits-what-fluent-rs = The words of the core, in every language, and the checking of words of one's own.
credits-what-pluralrules = Which form of a word goes with a number, in each language.
credits-what-unic-langid = Reads the names of languages.
credits-what-sys-locale = Finds out the language of the system.
credits-what-typst = Sets the pages of the preview and makes the PDF files.
credits-what-comemo = Remembers what Typst has worked out, so that pages are set again quickly.
credits-what-hayro = Draws the pages of PDF files, to read their text and to show them.
credits-what-lopdf = Reads and writes PDF files, for the text a PDF has and for the text laid over a scan.
credits-what-pdf-text-part = Reads the fonts and maps of characters of PDF files, for the code of pdf-extract taken into Glaukopis.
credits-what-image = Reads and writes pictures.
credits-what-rusqlite = Reads the database of Zotero, to import its references.
credits-what-sqlite = The database Zotero keeps its references in, read by way of rusqlite. Compiled in on Windows and macOS; on Linux, the system's.
credits-what-roxmltree = Reads XML: reference styles, Word documents and what catalogues send.
credits-what-zip = Reads and writes Word and OpenDocument files, projects as files and language packages.
credits-what-calamine = Reads spreadsheets, for tables brought in.
credits-what-encoding-rs = Reads text in the encodings older files have.
credits-what-spellbook = Checks spelling, with dictionaries of Hunspell's.
credits-what-icu = Knows what each character is, for finding words.
credits-what-unicode-normalization = Brings letters with marks to one form, so that they are found and compared.
credits-what-strsim = How alike two names or titles are, for finding duplicates.
credits-what-ureq = Speaks to the services references are looked up at, and to the server of language packages.
credits-what-sha2 = Tells files apart by what they hold.
credits-what-base64 = Carries pictures and files as text.
credits-what-serde = Reads and writes the data of Glaukopis as JSON.
credits-what-uuid = Gives everything that is kept a name of its own.
credits-what-time = Dates and times.
credits-what-tempfile = Writes files safely, by way of a file beside them.
credits-what-tracing = The log of what the application does.
credits-what-thiserror = The errors of the server Glaukopis comes with.
credits-what-tokio = Runs the server Glaukopis comes with, for sharing projects.
credits-what-axum = Answers those who connect to the server Glaukopis comes with.
credits-what-futures = Works with what the server is sent and sends, as it comes.
credits-what-clap = Reads what the server Glaukopis comes with is started with.
credits-what-getrandom = Makes the tokens and the codes of invitation of the server Glaukopis comes with.
credits-what-pdf-extract = Reads the text of PDF files. Taken into Glaukopis as pdf-text and changed, so that it gives the names of the glyphs.
credits-what-wrap-it = Lets text flow around what stands beside it, in the pages Typst sets. Comes with Glaukopis, shortened.
credits-what-literata = The font of texts in the interface.
credits-what-inter = The font of the interface.
credits-what-stix = The font of mathematics in the interface.
credits-what-typst-font = A font that Typst comes with, for the pages of documents. In the installers for Windows and macOS; on Linux, the system's.
credits-what-foxit = The fonts that stand in for the fourteen standard fonts of PDF, when PDF files are drawn and when pictures in PDF are set.
credits-what-csl-styles = The reference styles that come with Glaukopis, and those fetched from the repository.
credits-what-csl-locales = The words of citations in each language: "page", "chapter" and the like.
credits-what-ordboka = The words of the dictionaries of Norwegian Bokmål and Nynorsk, which come with Glaukopis.
credits-what-ordbank = The inflections of the words of the dictionaries of Norwegian.
credits-what-spell-norwegian = The rules of the dictionaries of Norwegian.
credits-what-spelling-en-us = The dictionary of American English, from the server of language packages.
credits-what-spelling-en-gb = The dictionary of British English, from the server of language packages.
credits-what-spelling-sv = The dictionary of Swedish, from the server of language packages.
credits-what-spelling-da = The dictionary of Danish, from the server of language packages.
credits-what-spelling-de = The dictionary of German, from the server of language packages.
credits-what-spelling-fr = The dictionary of French, from the server of language packages.
credits-what-spelling-it = The dictionary of Italian, from the server of language packages.
credits-what-tessdata = What Tesseract reads each language with, from the server of language packages.
credits-what-pandoc = Brings in documents from Word and other formats, and makes documents as Word, OpenDocument, LaTeX, HTML and EPUB.
credits-what-tesseract = Reads the text of scans and pictures.
credits-what-poppler = Draws the pages of PDF files that cannot be drawn otherwise, for reading their text.
credits-what-latex = Makes PDF files of the LaTeX a document is made as, with LuaLaTeX, XeLaTeX or pdfLaTeX.
credits-what-lucide = The icons of the interface.
credits-what-feather = Some of the icons of Lucide are drawn after those of Feather.
credits-name-owl = The owl of Glaukopis
credits-what-owl = The mark and the icon of Glaukopis: the owl of Athena, drawn by Robert Emil Berge after a photograph of an Athenian tetradrachm. Whoever uses the drawing names him as the one who drew it, and Classical Numismatic Group, Inc. (http://www.cngcoins.com) as the source of what it was drawn after.
credits-what-owl-photo = The photograph the owl is drawn after: an Athenian tetradrachm of 454–404 BC, by Classical Numismatic Group, Inc. (http://www.cngcoins.com).
